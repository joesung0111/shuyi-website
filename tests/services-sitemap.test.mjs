import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';

const root = new URL('../', import.meta.url);
const origin = 'https://sy-body.com';
const fixed = ['/', '/services/', '/offerings/', '/journal/', '/studio/', '/booking/'].map(path => origin + path);
const locations = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);

test('Services time copy and sitemap HTTP compatibility', async t => {
  // Only disposable fixtures are written; the project and production databases are never opened.
  const directory = await mkdtemp(join(tmpdir(), 'shuyi-http-test-'));
  const databasePath = join(directory, 'fixture.sqlite');
  const db = new DatabaseSync(databasePath);
  db.exec(`CREATE TABLE content (id INTEGER PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, type TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '', cover_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL, published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
  const insert = db.prepare('INSERT INTO content (title,slug,type,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)');
  for (const [slug, status] of [['qa-keep', 'published'], ['qa-delete', 'published'], ['qa-draft', 'draft']]) {
    insert.run(slug, slug, 'article', status, '2026-10-29T00:00:00Z', '2026-10-29T00:00:00Z', '2026-10-29T00:00:00Z');
  }
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const port = reservation.address().port;
  await new Promise(resolve => reservation.close(resolve));
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), DATABASE_PATH: databasePath, BOOKING_URL: 'https://booking.sy-body.com/' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = '';
  child.stdout.on('data', chunk => { logs += chunk; });
  child.stderr.on('data', chunk => { logs += chunk; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      if (child.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
      try { if ((await fetch(base + '/services/', { signal: AbortSignal.timeout(500) })).status === 200) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(ready, `Test server did not start: ${logs}`);
    let initialXml;
    await t.test('GET preserves fixed pages and all published fixtures while excluding drafts', async () => {
      const get = await fetch(base + '/sitemap.xml');
      assert.equal(get.status, 200);
      assert.equal(get.headers.get('content-type'), 'application/xml; charset=utf-8');
      initialXml = await get.text();
      assert(initialXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      const expectedPublished = db.prepare("SELECT slug FROM content WHERE status = 'published'").all().map(row => origin + '/journal/' + row.slug + '/');
      assert.deepEqual(locations(initialXml).sort(), [...fixed, ...expectedPublished].sort());
      assert(initialXml.includes('/journal/qa-keep/'));
      assert(initialXml.includes('/journal/qa-delete/'));
      assert(!initialXml.includes('qa-draft'));
    });
    await t.test('HEAD matches GET status and content type and has no response body', async () => {
      const head = await fetch(base + '/sitemap.xml', { method: 'HEAD' });
      const get = await fetch(base + '/sitemap.xml');
      assert.equal(head.status, get.status);
      assert.equal(head.status, 200);
      assert.equal(head.headers.get('content-type'), get.headers.get('content-type'));
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      assert.equal(await get.text(), initialXml);
    });
    await t.test('deleting a fixture removes only that article and keeps its URL a 404', async () => {
      db.prepare('DELETE FROM content WHERE slug = ?').run('qa-delete');
      const get = await fetch(base + '/sitemap.xml');
      assert.equal(get.status, 200);
      assert.deepEqual(locations(await get.text()), locations(initialXml).filter(url => !url.endsWith('/qa-delete/')));
      const removed = await fetch(base + '/journal/qa-delete/', { redirect: 'manual' });
      assert.equal(removed.status, 404);
      assert.equal(removed.headers.get('location'), null);
      const list = await (await fetch(base + '/api/content?status=published')).json();
      assert(list.some(row => row.slug === 'qa-keep'));
      assert(!list.some(row => row.slug === 'qa-delete' || row.slug === 'qa-draft'));
      assert.equal(list.length, db.prepare("SELECT COUNT(*) AS total FROM content WHERE status = 'published'").get().total);
      assert.equal((await fetch(base + '/journal/qa-keep/')).status, 200);
    });
    await t.test('initial Services HTML separates 40-minute care from a 60-minute visit in summary and FAQ', async () => {
      const html = await (await fetch(base + '/services/')).text();
      assert(!html.includes('30～60'));
      assert(html.includes('<dt>全身活化調理服務時間</dt><dd>約 40 分鐘'));
      assert(html.includes('<dt>建議預留到訪時間</dt><dd>約 60 分鐘'));
      assert.match(html, /<summary>一次大約多久？<\/summary><p>全身活化調理服務約 40 分鐘，建議預留約 60 分鐘的到訪時間/);
      assert(html.includes('其他服務項目依各項目實際標示的時間為準'));
      assert(html.includes('NT$1,600'));
      assert.equal((html.match(/<h1\b/g) || []).length, 1);
      assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
      assert.equal((html.match(/<details>/g) || []).length, 8);
    });
  } finally {
    child.kill('SIGTERM');
    await once(child, 'exit');
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
