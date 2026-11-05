import { classifyRequest, deviceDetails, sanitizePath, sanitizeReferer, verifyClaimedCrawler } from './classify.js';

const MAX_QUEUE = 10000;
const ALLOWED_EVENTS = new Set(['booking_cta_click', 'booking_platform_outbound', 'journal_to_service', 'journal_to_booking', 'form_submit_success', 'line_click', 'video_play', 'video_open', 'video_complete', 'booking_submit_success']);
const cleanId = (value) => /^[a-zA-Z0-9_-]{8,80}$/.test(String(value || '')) ? String(value) : '';
const stamp = () => new Date().toISOString();

export function createAnalytics(db, { trustedProxy, retentionDays = 30 } = {}) {
  db.exec(`PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS analytics_visitors (visitor_id TEXT PRIMARY KEY, first_seen TEXT NOT NULL, last_seen TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS analytics_sessions (session_id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, started_at TEXT NOT NULL, last_seen TEXT NOT NULL, entry_path TEXT NOT NULL DEFAULT '', referrer TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT 'unknown', browser TEXT NOT NULL DEFAULT 'Other', os TEXT NOT NULL DEFAULT 'Other', ip TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', bot_category TEXT NOT NULL DEFAULT 'unknown', bot_engine TEXT NOT NULL DEFAULT '', crawler_claimed INTEGER NOT NULL DEFAULT 0, FOREIGN KEY(visitor_id) REFERENCES analytics_visitors(visitor_id));
    CREATE TABLE IF NOT EXISTS analytics_pageviews (id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, entered_at TEXT NOT NULL, page_path TEXT NOT NULL, referrer TEXT NOT NULL DEFAULT '', previous_path TEXT NOT NULL DEFAULT '', duration_seconds INTEGER NOT NULL DEFAULT 0, device TEXT NOT NULL DEFAULT 'unknown', browser TEXT NOT NULL DEFAULT 'Other', os TEXT NOT NULL DEFAULT 'Other', FOREIGN KEY(session_id) REFERENCES analytics_sessions(session_id));
    CREATE TABLE IF NOT EXISTS analytics_events (id INTEGER PRIMARY KEY AUTOINCREMENT, visitor_id TEXT NOT NULL, session_id TEXT NOT NULL, pageview_id TEXT NOT NULL DEFAULT '', occurred_at TEXT NOT NULL, event_name TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', FOREIGN KEY(session_id) REFERENCES analytics_sessions(session_id));
    CREATE TABLE IF NOT EXISTS analytics_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, occurred_at TEXT NOT NULL, ip TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', method TEXT NOT NULL, path TEXT NOT NULL, status INTEGER NOT NULL, user_agent TEXT NOT NULL DEFAULT '', referer TEXT NOT NULL DEFAULT '', request_kind TEXT NOT NULL, bot_category TEXT NOT NULL, bot_engine TEXT NOT NULL DEFAULT '', crawler_claimed INTEGER NOT NULL DEFAULT 0, crawler_verified INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS analytics_visitors_time ON analytics_visitors(last_seen);
    CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen ON analytics_sessions(last_seen);
    CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_time ON analytics_sessions(visitor_id, started_at);
    CREATE INDEX IF NOT EXISTS analytics_sessions_time ON analytics_sessions(started_at);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_time ON analytics_pageviews(entered_at);
    CREATE INDEX IF NOT EXISTS analytics_pageviews_session ON analytics_pageviews(session_id, entered_at);
    CREATE INDEX IF NOT EXISTS analytics_events_session_time ON analytics_events(session_id, occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_events_time ON analytics_events(occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_requests_time ON analytics_requests(occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_requests_ip_time ON analytics_requests(ip, occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_requests_path_time ON analytics_requests(path, occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_requests_bot_time ON analytics_requests(bot_category, bot_engine, occurred_at);
    CREATE INDEX IF NOT EXISTS analytics_requests_status_time ON analytics_requests(status, occurred_at);`);

  // Additive migrations keep existing records intact. Legacy rows have unknown provenance.
  for (const table of ['analytics_requests', 'analytics_sessions']) {
    const columns = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
    for (const [name, type] of [['ip_source', "TEXT NOT NULL DEFAULT 'legacy'"], ['peer_masked', "TEXT NOT NULL DEFAULT ''"], ['is_admin', 'INTEGER NOT NULL DEFAULT 0']]) {
      if (!columns.has(name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS ${table}_admin_time ON ${table}(is_admin, ${table === 'analytics_requests' ? 'occurred_at' : 'started_at'})`);
  }

  const requestQueue = [];
  const insertRequest = db.prepare(`INSERT INTO analytics_requests (occurred_at,ip,country,method,path,status,user_agent,referer,request_kind,bot_category,bot_engine,crawler_claimed,crawler_verified,ip_source,peer_masked,is_admin) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
  const flushRequests = () => {
    if (!requestQueue.length) return;
    const batch = requestQueue.splice(0, 500);
    const rows = [];
    db.exec('BEGIN');
    try {
      for (const entry of batch) {
        const result = insertRequest.run(entry.at, entry.data.ip, entry.data.country, entry.method, entry.data.path, entry.status, entry.data.ua, entry.data.referer, entry.data.kind, entry.data.bot.category, entry.data.bot.engine || '', Number(entry.data.bot.claimed), 0, entry.data.ipSource, entry.data.peerMasked, Number(entry.data.isAdmin));
        if (entry.data.bot.claimed && entry.data.bot.engine && entry.data.ip) rows.push({ id: Number(result.lastInsertRowid), ip: entry.data.ip, engine: entry.data.bot.engine });
      }
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); console.error('Analytics request batch write failed:', error.message); }
    for (const row of rows) verifyClaimedCrawler(row.ip, row.engine).then((verified) => {
      if (verified) db.prepare('UPDATE analytics_requests SET crawler_verified=1 WHERE id=?').run(row.id);
    }).catch(() => {});
    if (requestQueue.length) setImmediate(flushRequests);
  };
  const timer = setInterval(flushRequests, 300);
  timer.unref();

  function recordRequest(req, res) {
    const data = classifyRequest(req, trustedProxy || (() => false));
    const occurredAt = stamp();
    let recorded = false;
    const record = (status) => {
      if (recorded || requestQueue.length >= MAX_QUEUE) return;
      recorded = true;
      requestQueue.push({ at: occurredAt, data, method: String(req.method || 'GET').slice(0, 12), status: Number(status) || 0 });
      if (requestQueue.length >= 500) setImmediate(flushRequests);
    };
    res.once('finish', () => record(res.statusCode));
    res.once('close', () => { if (!res.writableFinished) record(499); });
  }

  const insertVisitor = db.prepare('INSERT INTO analytics_visitors(visitor_id,first_seen,last_seen) VALUES(?,?,?) ON CONFLICT(visitor_id) DO UPDATE SET last_seen=excluded.last_seen');
  const hasColumn = (name) => db.prepare('PRAGMA table_info(analytics_sessions)').all().some((column) => column.name === name);
  if (!hasColumn('ip')) db.exec("ALTER TABLE analytics_sessions ADD COLUMN ip TEXT NOT NULL DEFAULT ''");
  if (!hasColumn('country')) db.exec("ALTER TABLE analytics_sessions ADD COLUMN country TEXT NOT NULL DEFAULT ''");
  if (!hasColumn('bot_category')) db.exec("ALTER TABLE analytics_sessions ADD COLUMN bot_category TEXT NOT NULL DEFAULT 'unknown'");
  if (!hasColumn('bot_engine')) db.exec("ALTER TABLE analytics_sessions ADD COLUMN bot_engine TEXT NOT NULL DEFAULT ''");
  if (!hasColumn('crawler_claimed')) db.exec('ALTER TABLE analytics_sessions ADD COLUMN crawler_claimed INTEGER NOT NULL DEFAULT 0');
  const insertSession = db.prepare(`INSERT INTO analytics_sessions(session_id,visitor_id,started_at,last_seen,entry_path,referrer,device,browser,os,ip,country,bot_category,bot_engine,crawler_claimed,ip_source,peer_masked,is_admin) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(session_id) DO UPDATE SET last_seen=excluded.last_seen,ip=CASE WHEN excluded.ip='' THEN analytics_sessions.ip ELSE excluded.ip END,country=CASE WHEN excluded.country='' THEN analytics_sessions.country ELSE excluded.country END,bot_category=excluded.bot_category,bot_engine=excluded.bot_engine,crawler_claimed=excluded.crawler_claimed,ip_source=excluded.ip_source,peer_masked=excluded.peer_masked,is_admin=MAX(analytics_sessions.is_admin,excluded.is_admin)`);
  const insertPageview = db.prepare('INSERT OR IGNORE INTO analytics_pageviews(id,visitor_id,session_id,entered_at,page_path,referrer,previous_path,device,browser,os) VALUES(?,?,?,?,?,?,?,?,?,?)');
  const insertEvent = db.prepare('INSERT INTO analytics_events(visitor_id,session_id,pageview_id,occurred_at,event_name,target) VALUES(?,?,?,?,?,?)');

  function receive(body, req) {
    const visitorId = cleanId(body?.visitorId);
    const sessionId = cleanId(body?.sessionId);
    if (!visitorId || !sessionId || !Array.isArray(body.items) || body.items.length > 30) return { ok: false, error: 'invalid_payload' };
    const ua = String(req.headers['user-agent'] || '').slice(0, 512);
    const details = deviceDetails(ua);
    const now = stamp();
    const referrer = sanitizeReferer(body.referrer || req.headers.referer);
    const path = sanitizePath(body.path);
    const existing = db.prepare('SELECT visitor_id FROM analytics_sessions WHERE session_id=?').get(sessionId);
    if (existing && existing.visitor_id !== visitorId) return { ok: false, error: 'session_mismatch' };
    insertVisitor.run(visitorId, now, now);
    const requestInfo = classifyRequest(req, trustedProxy || (() => false));
    insertSession.run(sessionId, visitorId, now, now, path, referrer, details.device, details.browser, details.os, requestInfo.ip, requestInfo.country, requestInfo.bot.category, requestInfo.bot.engine || '', Number(requestInfo.bot.claimed), requestInfo.ipSource, requestInfo.peerMasked, Number(requestInfo.isAdmin));
    let saved = 0;
    for (const item of body.items) {
      if (item?.type === 'pageview') {
        const id = cleanId(item.id);
        if (!id) continue;
        insertPageview.run(id, visitorId, sessionId, now, sanitizePath(item.path), sanitizeReferer(item.referrer), item.previousPath ? sanitizePath(item.previousPath) : '', details.device, details.browser, details.os);
        saved++;
      } else if (item?.type === 'duration') {
        const id = cleanId(item.id);
        const seconds = Math.max(0, Math.min(86400, Math.floor(Number(item.seconds) || 0)));
        if (id) saved += db.prepare('UPDATE analytics_pageviews SET duration_seconds=MAX(duration_seconds,?) WHERE id=? AND session_id=?').run(seconds, id, sessionId).changes;
      } else if (item?.type === 'event') {
        const name = ALLOWED_EVENTS.has(String(item.name || '')) ? String(item.name) : '';
        if (!name) continue;
        const pageviewId = cleanId(item.pageviewId);
        if (pageviewId && !db.prepare('SELECT id FROM analytics_pageviews WHERE id=? AND session_id=?').get(pageviewId, sessionId)) continue;
        const target = String(item.target || '').replace(/[^a-zA-Z0-9_./:-]/g, '').slice(0, 64);
        insertEvent.run(visitorId, sessionId, pageviewId, now, name, target);
        saved++;
      }
    }
    return { ok: true, accepted: saved };
  }

  function cleanup() {
    const cutoff = new Date(Date.now() - Math.max(1, Number(retentionDays) || 30) * 86400000).toISOString();
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM analytics_events WHERE occurred_at < ?').run(cutoff);
      db.prepare('DELETE FROM analytics_pageviews WHERE entered_at < ?').run(cutoff);
      db.prepare('DELETE FROM analytics_sessions WHERE last_seen < ?').run(cutoff);
      db.prepare('DELETE FROM analytics_visitors WHERE last_seen < ?').run(cutoff);
      db.prepare('DELETE FROM analytics_requests WHERE occurred_at < ?').run(cutoff);
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  const cleanupTimer = setInterval(() => { try { flushRequests(); cleanup(); } catch (error) { console.error('Analytics cleanup failed:', error.message); } }, 24 * 60 * 60 * 1000);
  cleanupTimer.unref();
  try { cleanup(); } catch (error) { console.error('Analytics initial cleanup failed:', error.message); }

  return { recordRequest, receive, flush: () => { while (requestQueue.length) flushRequests(); } };
}
