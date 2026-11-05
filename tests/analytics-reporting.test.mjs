import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createAnalytics } from '../analytics/store.js';
import { createAnalyticsReports } from '../analytics/reports.js';
import { csvCell, csvRequest, LOG_LIMITS } from '../analytics/request-log.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  createAnalytics(db);
  const reports = createAnalyticsReports(db);
  const day = new Date().toISOString().slice(0, 10);
  const at = `${day}T12:00:00.000Z`;
  const query = () => new URLSearchParams({ from: day, to: day });
  const insert = db.prepare(`INSERT INTO analytics_requests (occurred_at,ip,method,path,status,user_agent,request_kind,bot_category,is_admin,ip_source) VALUES (?,?,?,?,?,?,?,?,?,?)`);
  const add = (count, overrides = {}) => {
    for (let i = 0; i < count; i++) insert.run(overrides.at || at, overrides.ip || '203.0.113.123', 'GET', overrides.path || '/services/', overrides.status || 200, overrides.ua || 'Mozilla/5.0', overrides.kind || 'page', overrides.bot || 'visitor', overrides.admin || 0, 'socket');
  };
  return { db, reports, day, at, query, add };
}

test('cursor paging remains stable with identical timestamps and requests inserted between pages', () => {
  const f = fixture();
  try {
    f.add(131);
    const query = f.query();
    const first = f.reports.requestPage(query);
    assert.equal(first.rows.length, 50); assert.equal(first.total, 131);
    f.add(4); // Newer IDs with the same timestamp must not move the snapshot.
    const ids = first.rows.map((row) => row.id);
    let cursor = first.nextCursor;
    while (cursor) {
      query.set('cursor', cursor);
      const page = f.reports.requestPage(query);
      assert.equal(page.total, 131);
      ids.push(...page.rows.map((row) => row.id)); cursor = page.nextCursor;
    }
    assert.equal(ids.length, 131); assert.equal(new Set(ids).size, 131);
    assert.deepEqual(ids, Array.from({ length: 131 }, (_, i) => 131 - i));
    query.set('cursor', first.startCursor);
    assert.deepEqual(f.reports.requestPage(query).rows.map((row) => row.id), first.rows.map((row) => row.id));
    query.delete('cursor'); assert.equal(f.reports.requestPage(query).total, 135);
    assert.equal(f.reports.prepareExport(new URLSearchParams({ ...Object.fromEntries(f.query()), cursor: first.startCursor })).total, 131);
  } finally { f.db.close(); }
});

test('cursors reject tampering, changed filters and expiry; ranges and statuses are bounded', () => {
  const f = fixture();
  try {
    f.add(2);
    const first = f.reports.requestPage(f.query());
    for (const query of [
      new URLSearchParams({ ...Object.fromEntries(f.query()), cursor: first.startCursor + 'x' }),
      new URLSearchParams({ ...Object.fromEntries(f.query()), cursor: first.startCursor, path: '/different/' }),
      new URLSearchParams({ from: '2026-01-01', to: '2026-02-01' }),
      new URLSearchParams({ from: '2026-02-31', to: '2026-03-05' }),
      new URLSearchParams({ ...Object.fromEntries(f.query()), status: '999' })
    ]) assert.throws(() => f.reports.requestPage(query), { statusCode: 400 });
    const originalNow = Date.now;
    try {
      Date.now = () => originalNow() + 31 * 60000;
      assert.throws(() => f.reports.requestPage(new URLSearchParams({ ...Object.fromEntries(f.query()), cursor: first.startCursor })), { statusCode: 400 });
    } finally { Date.now = originalNow; }
    const payload = Buffer.from(first.startCursor.split('.')[0], 'base64url').toString();
    assert(!payload.includes('203.0.113')); assert(!payload.includes('Mozilla'));
  } finally { f.db.close(); }
});

test('request filters match counts and export; user wildcards are treated literally', () => {
  const f = fixture();
  try {
    f.add(3, { admin: 1, kind: 'api', path: '/api/content' });
    f.add(4, { bot: 'other_bot', kind: 'static', path: '/app.js' });
    f.add(2, { path: '/literal%_path/' });
    const admin = f.query(); admin.set('bot', 'admin'); admin.set('kind', 'api');
    assert.equal(f.reports.requestPage(admin).total, 3);
    assert.equal([...f.reports.prepareExport(admin).batches()].flat().length, 3);
    const wildcard = f.query(); wildcard.set('path', '%_');
    assert.equal(f.reports.requestPage(wildcard).total, 2);
    const limit = f.query(); limit.set('limit', '100000');
    assert.equal(f.reports.requestPage(limit).limit, 100);
  } finally { f.db.close(); }
});

test('CSV always masks IPs, escapes quotes and prevents spreadsheet formula injection', () => {
  assert.equal(csvCell('=HYPERLINK("https://evil.test")'), '"\'=HYPERLINK(""https://evil.test"")"');
  assert(csvCell(' \t@SUM(1)').startsWith('"\''));
  assert.equal(csvCell('a,b\nc'), '"a,b\nc"');
  const line = csvRequest({ occurred_at: '2026-11-05', ip: '203.0.113.123', method: 'GET', path: '/services/', user_agent: '=1+1', status: 200 });
  assert(line.includes('203.0.113.0')); assert(!line.includes('203.0.113.123')); assert(line.includes('"\'=1+1"'));
});

test('export refuses oversized results before creating a stream', () => {
  const f = fixture();
  try {
    f.add(LOG_LIMITS.exportRows + 1);
    assert.throws(() => f.reports.prepareExport(f.query()), { statusCode: 413 });
    f.db.exec('DELETE FROM analytics_requests');
    f.add(2500, { path: '/'+ 'x'.repeat(1000), ua: 'x'.repeat(500) });
    const referer = 'https://example.test/' + 'x'.repeat(1000);
    f.db.prepare('UPDATE analytics_requests SET referer=?').run(referer);
    assert.throws(() => f.reports.prepareExport(f.query()), { statusCode: 413 });
  } finally { f.db.close(); }
});

test('trend fills empty intervals and independently counts administrator requests', () => {
  const f = fixture();
  try {
    f.add(3, { admin: 1 }); f.add(2, { bot: 'search_engine' });
    const trend = f.reports.trend(f.query());
    assert.equal(trend.length, 24);
    const noon = trend.find((row) => row.bucket.endsWith('T12:00'));
    assert.equal(noon.requests, 5); assert.equal(noon.admin_requests, 3); assert.equal(noon.crawlers, 2);
    assert.equal(trend.filter((row) => row.requests === 0).length, 23);
    assert(!noon.bucket.endsWith('Z'), 'Local buckets must not falsely claim UTC');
    const plan = f.db.prepare('EXPLAIN QUERY PLAN SELECT id FROM analytics_requests WHERE occurred_at>=? AND occurred_at<? ORDER BY occurred_at DESC,id DESC LIMIT 50').all(f.at, `${f.day}T23:59:59.000Z`);
    assert(plan.some((row) => /INDEX analytics_requests_time/.test(row.detail)));
  } finally { f.db.close(); }
});
