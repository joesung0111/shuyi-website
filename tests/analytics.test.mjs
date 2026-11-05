import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { classifyUserAgent, deviceDetails, sanitizePath, sanitizeReferer } from '../analytics/classify.js';

test('analytics classifier distinguishes crawler claims from verified identity', () => {
  const google = classifyUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
  assert.equal(google.engine, 'Google');
  assert.equal(google.claimed, true);
  assert.equal(google.category, 'search_engine');
  assert.equal(classifyUserAgent('Mozilla/5.0 Chrome/120 Safari/537.36').category, 'visitor');
  assert.equal(classifyUserAgent('curl/8.4.0').category, 'suspected_automation');
  assert.equal(deviceDetails('Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36').device, 'mobile');
  assert.equal(deviceDetails('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36').device, 'desktop');
  assert.equal(sanitizePath('/journal/a/?token=secret&email=user@example.test'), '/journal/a/');
  assert.equal(sanitizeReferer('https://example.test/path?secret=value#part'), 'https://example.test/path');
});

test('analytics collection is public but every report requires the existing admin session', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'shuyi-analytics-test-'));
  const databasePath = join(directory, 'analytics.sqlite');
  const reservation = createServer(); reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening');
  const port = reservation.address().port; await new Promise((resolve) => reservation.close(resolve));
  const child = spawn(process.execPath, ['server.js'], { cwd: new URL('../', import.meta.url), env: { ...process.env, PORT: String(port), DATABASE_PATH: databasePath, SHUYI_ADMIN_PASSWORD: 'isolated-test-password' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stdout.on('data', (chunk) => { logs += chunk; }); child.stderr.on('data', (chunk) => { logs += chunk; });
  const base = `http://127.0.0.1:${port}`;
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) {
      if (child.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
      try { if ((await fetch(`${base}/`, { signal: AbortSignal.timeout(500) })).ok) { ready = true; break; } } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert(ready, `Test server failed to start: ${logs}`);
    const home = await (await fetch(`${base}/`)).text();
    assert(home.includes('<script src="/analytics.js" defer></script>'));
    assert(!home.includes('googletagmanager.com/gtag/js'));
    assert(home.includes('<link rel="canonical" href="https://sy-body.com/">'));
    assert(home.includes('application/ld+json'));
    const robots = await (await fetch(`${base}/robots.txt`)).text();
    assert(robots.includes('Disallow: /admin/')); assert(robots.includes('Disallow: /api/')); assert(robots.includes('Sitemap: https://sy-body.com/sitemap.xml'));
    assert.equal((await fetch(`${base}/analytics.js`)).status, 200);
    assert.equal((await fetch(`${base}/api/analytics/overview`)).status, 401);

    const visitorId = 'visitor_fixture_0001'; const sessionId = 'session_fixture_0001'; const pageviewId = 'pageview_fixture_0001';
    const collect = await fetch(`${base}/api/analytics/collect`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36', referer: 'https://search.example.test/start?campaign=private', 'cf-connecting-ip': '203.0.113.9', 'cf-ipcountry': 'TW' }, body: JSON.stringify({ visitorId, sessionId, path: '/services/?email=private', referrer: 'https://search.example.test/start?campaign=private', device: 'mobile', browser: 'Chrome', os: 'Android', items: [{ type: 'pageview', id: pageviewId, path: '/services/?email=private', previousPath: '/' }, { type: 'event', pageviewId, name: 'booking_cta_click', target: 'booking' }] }) });
    assert.equal(collect.status, 202);
    assert.equal((await collect.json()).accepted, 2);
    const secondCollect = await fetch(`${base}/api/analytics/collect`, { method: 'POST', headers: { 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' }, body: JSON.stringify({ visitorId: 'visitor_fixture_0002', sessionId: 'session_fixture_0002', path: '/', device: 'desktop', browser: 'Chrome', os: 'Windows', items: [{ type: 'pageview', id: 'pageview_fixture_0002', path: '/', previousPath: '' }] }) });
    assert.equal(secondCollect.status, 202);
    await fetch(`${base}/journal/missing-analytics-test/`, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } });
    await fetch(`${base}/api/content?password=must-not-be-stored`);
    await new Promise((resolve) => setTimeout(resolve, 450));

    const login = await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: 'isolated-test-password' }) });
    assert.equal(login.status, 200); const { token } = await login.json();
    const headers = { authorization: `Bearer ${token}` };
    const today = new Date().toISOString().slice(0, 10); const query = new URLSearchParams({ from: today, to: today });
    const overviewResponse = await fetch(`${base}/api/analytics/overview?${query}`, { headers });
    assert.equal(overviewResponse.status, 200); const overview = await overviewResponse.json();
    assert.equal(overview.visitors, 2); assert.equal(overview.sessions, 2); assert.equal(overview.pageviews, 2); assert(overview.requests >= 2);
    const trend = await fetch(`${base}/api/analytics/trend?${query}`, { headers }); assert.equal(trend.status, 200); assert(Array.isArray(await trend.json()));
    const visitorRows = await (await fetch(`${base}/api/analytics/visitors?${query}`, { headers })).json();
    assert.equal(visitorRows.length, 2); assert(visitorRows.some((row) => row.device === 'mobile')); assert(visitorRows.some((row) => row.device === 'desktop'));
    assert(visitorRows.every((row) => row.ip !== '203.0.113.9' && row.country !== 'TW'));
    const journey = await (await fetch(`${base}/api/analytics/sessions/${sessionId}`, { headers })).json();
    assert.equal(journey.pages[0].page_path, '/services/'); assert.equal(journey.pages[0].previous_path, '/'); assert.equal(journey.events[0].event_name, 'booking_cta_click');
    assert.equal(journey.pages[0].referrer, '');
    const requestRows = await (await fetch(`${base}/api/analytics/requests?${query}&engine=Google&bot=search_engine`, { headers })).json();
    assert(requestRows.some((row) => row.bot_engine === 'Google' && row.crawler_claimed === 1 && row.crawler_verified === 0));
    assert(requestRows.some((row) => row.status === 404));
    assert(requestRows.every((row) => !row.path.includes('?')));
    const crawlResponse = await fetch(`${base}/api/analytics/crawlers?${query}`, { headers }); assert.equal(crawlResponse.status, 200); assert((await crawlResponse.json()).pages.length > 0);
    const privateRequest = await (await fetch(`${base}/api/analytics/requests?${query}`, { headers })).json();
    assert(privateRequest.every((row) => !row.path.includes('must-not-be-stored')));
    const timeFiltered = await (await fetch(`${base}/api/analytics/requests?${query}&fromTime=${today}T00%3A00&toTime=${today}T23%3A59&status=404`, { headers })).json();
    assert(timeFiltered.length > 0); assert(timeFiltered.every((row) => row.status === 404));
    assert.equal((await fetch(`${base}/api/analytics/visitors`)).status, 401);
    assert.equal((await fetch(`${base}/admin/analytics/`)).status, 200);
    assert((await (await fetch(`${base}/admin/analytics/`)).text()).includes('流量分析'));
  } finally {
    child.kill('SIGTERM'); await once(child, 'exit'); await rm(directory, { recursive: true, force: true });
  }
});
