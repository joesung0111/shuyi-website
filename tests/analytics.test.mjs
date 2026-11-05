import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { classifyUserAgent, deviceDetails, sanitizePath, sanitizeReferer, resolveClient, maskedIp } from '../analytics/classify.js';

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

test('proxy attribution rejects forged headers outside the explicit ingress trust boundary', () => {
  const options = { railway: true, railwayPeers: ['100.64.0.1'], cloudflare: (ip) => ip === '173.245.48.1' };
  const req = (peer, headers = {}) => ({ socket: { remoteAddress: peer }, headers });
  assert.equal(resolveClient(req('203.0.113.10', { 'x-real-ip': '198.51.100.66', 'x-forwarded-for': '198.51.100.67', 'cf-connecting-ip': '198.51.100.68' }), options).ip, '203.0.113.10');
  const railway = resolveClient(req('100.64.0.1', { 'x-real-ip': '203.0.113.10', 'cf-connecting-ip': '198.51.100.66', 'x-forwarded-for': '198.51.100.67' }), options);
  assert.equal(railway.ip, '203.0.113.10'); assert.equal(railway.source, 'railway-x-real-ip');
  const cf = resolveClient(req('100.64.0.1', { 'x-real-ip': '173.245.48.1', 'cf-connecting-ip': '203.0.113.10', 'cf-ipcountry': 'TW' }), options);
  assert.equal(cf.ip, '203.0.113.10'); assert.equal(cf.country, 'TW');
  assert.equal(resolveClient(req('100.64.0.99', { 'x-real-ip': '203.0.113.10' }), options).source, 'unresolved-proxy');
  assert.equal(resolveClient(req('100.64.0.1', { 'x-real-ip': 'invalid' }), options).ip, '');
  assert.equal(maskedIp('100.64.0.13'), '100.64.0.0');
  assert.equal(maskedIp('2001:db8::1234'), '2001:db8:0:0::');
});

test('server refuses to start without configured admin credentials', async () => {
  const env = { ...process.env }; delete env.SHUYI_ADMIN_PASSWORD;
  const child = spawn(process.execPath, ['server.js'], { cwd: new URL('../', import.meta.url), env, stdio: 'pipe' });
  child.stdout.resume(); child.stderr.resume();
  const [code] = await once(child, 'exit'); assert.notEqual(code, 0);
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
    assert(robots.includes('Disallow: /admin/')); assert(robots.includes('Disallow: /manage-center/')); assert(robots.includes('Disallow: /api/')); assert(robots.includes('Sitemap: https://sy-body.com/sitemap.xml'));
    assert.equal((await fetch(`${base}/analytics.js`)).status, 200);
    for (const path of ['/server.js', '/package.json', '/.env.example', '/.env', '/.git/config', '/data/shuyi.sqlite', '/analytics/store.js', '/analytics/request-log.js', '/content/editorial-articles.json', '/tests/analytics.test.mjs', '/admin/', '/admin/admin.js', '/public/analytics.js']) {
      for (const method of ['GET', 'HEAD']) assert.equal((await fetch(`${base}${path}`, { method })).status, 404, `${method} ${path}`);
    }
    for (const path of ['/manage-center/', '/manage-center/admin.js', '/manage-center/admin.css', '/manage-center/analytics.js', '/manage-center/favicon.svg']) assert.equal((await fetch(`${base}${path}`)).status, 200, path);
    assert.equal((await fetch(`${base}/api/admin/login`, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' })).status, 403);
    assert.equal((await fetch(`${base}/api/analytics/diagnostics`)).status, 401);

    for (const endpoint of ['overview', 'dashboard', 'requests/page', 'requests/export', 'events/details?event=line_click']) assert.equal((await fetch(`${base}/api/analytics/${endpoint}`)).status, 401);

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
    const diagnostics = await (await fetch(`${base}/api/analytics/diagnostics`, { headers })).json();
    assert.equal(diagnostics.source, 'socket');
    const mismatch = await fetch(`${base}/api/analytics/collect`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ visitorId: 'another_visitor_0001', sessionId, items: [] }) });
    assert.equal(mismatch.status, 400);
    const adminCollect = await fetch(`${base}/api/analytics/collect`, { method: 'POST', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ visitorId: 'admin_visitor_0001', sessionId: 'admin_session_0001', path: '/', items: [{ type: 'pageview', id: 'admin_pageview_0001', path: '/' }, { type: 'event', pageviewId: 'admin_pageview_0001', name: 'line_click', target: 'line_official' }] }) });
    assert.equal(adminCollect.status, 202);
    const overviewResponse = await fetch(`${base}/api/analytics/overview?${query}`, { headers });
    assert.equal(overviewResponse.status, 200); const overview = await overviewResponse.json();
    assert.equal(overview.visitors, 2); assert.equal(overview.sessions, 2); assert.equal(overview.pageviews, 2); assert(overview.requests >= 2);
    const trend = await fetch(`${base}/api/analytics/trend?${query}`, { headers }); assert.equal(trend.status, 200); assert(Array.isArray(await trend.json()));
    const visitorRows = await (await fetch(`${base}/api/analytics/visitors?${query}`, { headers })).json();
    assert.equal(visitorRows.length, 3); assert(visitorRows.some((row) => row.device === 'mobile')); assert(visitorRows.some((row) => row.device === 'desktop'));
    assert(visitorRows.some((row) => row.is_admin === 1));
    assert(visitorRows.every((row) => row.ip !== '203.0.113.9' && row.country !== 'TW'));
    const journey = await (await fetch(`${base}/api/analytics/sessions/${sessionId}`, { headers })).json();
    assert.equal(journey.pages[0].page_path, '/services/'); assert.equal(journey.pages[0].previous_path, '/'); assert.equal(journey.events[0].event_name, 'booking_cta_click');
    assert.equal(journey.pages[0].referrer, '');
    const requestRows = await (await fetch(`${base}/api/analytics/requests?${query}&engine=Google&bot=search_engine`, { headers })).json();
    assert(requestRows.some((row) => row.bot_engine === 'Google' && row.crawler_claimed === 1 && row.crawler_verified === 0));
    assert(requestRows.some((row) => row.status === 404));
    assert(requestRows.every((row) => !row.path.includes('?')));
    const crawlResponse = await fetch(`${base}/api/analytics/crawlers?${query}`, { headers }); assert.equal(crawlResponse.status, 200); assert((await crawlResponse.json()).pages.length > 0);
    assert(requestRows.every((row) => !('cookie' in row) && !('authorization' in row)));
    const dashboard = await (await fetch(`${base}/api/analytics/dashboard?${query}`, { headers })).json();
    assert.equal(dashboard.limits.exportRows, 10000); assert.equal(dashboard.limits.exportBytes, 10 * 1024 * 1024);
    assert(dashboard.trend.some((row) => Object.hasOwn(row, 'admin_requests')));
    const logPage = await (await fetch(`${base}/api/analytics/requests/page?${query}`, { headers })).json();
    assert(Array.isArray(logPage.rows)); assert(logPage.total >= logPage.rows.length); assert(logPage.startCursor);
    assert(logPage.rows.every((row) => row.ip !== '127.0.0.1'));
    const exportResponse = await fetch(`${base}/api/analytics/requests/export?${query}&cursor=${encodeURIComponent(logPage.startCursor)}&fullIp=1`, { headers });
    assert.equal(exportResponse.status, 200); assert(exportResponse.headers.get('content-type').includes('text/csv'));
    assert.equal(Number(exportResponse.headers.get('x-export-row-count')), logPage.total);
    const csv = await exportResponse.text(); assert(csv.includes('IP（遮罩）')); assert(!csv.includes('127.0.0.1'));
    const secondExport = await fetch(`${base}/api/analytics/requests/export?${query}&cursor=${encodeURIComponent(logPage.startCursor)}`, { headers });
    assert.equal(secondExport.status, 200); await secondExport.text();
    assert.equal((await fetch(`${base}/api/analytics/requests/export?${query}`, { headers })).status, 429);
    const details = await (await fetch(`${base}/api/analytics/events/details?${query}&event=booking_cta_click`, { headers })).json();
    assert(details.pages.some((row) => row.page_path === '/services/' && row.count === 1));
    assert.equal((await (await fetch(`${base}/api/analytics/events/details?${query}&event=line_click`, { headers })).json()).recent.length, 0, 'Administrator events must stay out of visitor event detail');
    assert.equal((await fetch(`${base}/api/analytics/requests/page?from=2026-01-01&to=2026-03-01`, { headers })).status, 400);
    const events = await (await fetch(`${base}/api/analytics/events?${query}`, { headers })).json();
    assert(events.some((event) => event.event_name === 'booking_cta_click'));
    const privateRequest = await (await fetch(`${base}/api/analytics/requests?${query}`, { headers })).json();
    assert(privateRequest.every((row) => !row.path.includes('must-not-be-stored')));
    const timeFiltered = await (await fetch(`${base}/api/analytics/requests?${query}&fromTime=${today}T00%3A00&toTime=${today}T23%3A59&status=404`, { headers })).json();
    assert(timeFiltered.length > 0); assert(timeFiltered.every((row) => row.status === 404));
    assert.equal((await fetch(`${base}/api/analytics/visitors`)).status, 401);
    await new Promise((resolve) => setTimeout(resolve, 400));
    const adminRows = await (await fetch(`${base}/api/analytics/requests?${query}&bot=admin`, { headers })).json();
    assert(adminRows.length > 0); assert(adminRows.every((row) => row.is_admin === 1));
    for (let i = 0; i < 10; i++) assert.equal((await fetch(`${base}/api/admin/login`, { method: 'POST', body: JSON.stringify({ password: 'wrong-test-password' }) })).status, 401);
    assert.equal((await fetch(`${base}/api/admin/login`, { method: 'POST', body: '{}' })).status, 429);

    assert.equal((await fetch(`${base}/manage-center/analytics/`)).status, 200);
    assert((await (await fetch(`${base}/manage-center/analytics/`)).text()).includes('流量分析'));
    assert(!logs.includes('ERR_HTTP_HEADERS_SENT'), 'Completed API responses must not fall through to static serving');
  } finally {
    child.kill('SIGTERM'); await once(child, 'exit'); await rm(directory, { recursive: true, force: true });
  }
});
