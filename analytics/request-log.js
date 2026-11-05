import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { maskedIp } from './classify.js';

export const LOG_LIMITS = Object.freeze({ rangeDays: 31, pageRows: 100, exportRows: 10000, exportBytes: 10 * 1024 * 1024, snapshotMinutes: 30 });
export function queryError(message, statusCode = 400) { return Object.assign(new Error(message), { statusCode }); }
const columns = 'id,occurred_at,ip,country,method,path,status,user_agent,referer,request_kind,bot_category,bot_engine,crawler_claimed,crawler_verified,is_admin,ip_source';
const positiveInt = (value) => Number.isSafeInteger(value) && value >= 0;

// Cursors are signed, expire, and bind to the filters. No session credentials or IPs are embedded.
export function createRequestLog(db, range) {
  const secret = randomBytes(32);
  const sign = (value) => createHmac('sha256', secret).update(value).digest('base64url');
  const encode = (value) => { const text = Buffer.from(JSON.stringify(value)).toString('base64url'); return `${text}.${sign(text)}`; };
  function decode(cursor) {
    try {
      if (cursor.length > 2048) throw new Error();
      const [text, signature, extra] = cursor.split('.');
      const expected = sign(text || '');
      if (extra || !signature || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error();
      const value = JSON.parse(Buffer.from(text, 'base64url').toString());
      if (!positiveInt(value.maxId) || !positiveInt(value.total) || !positiveInt(value.offset) || value.expires <= Date.now()) throw new Error();
      return value;
    } catch { throw queryError('查詢頁面已過期或無效，請按「重新查詢」取得新快照。'); }
  }
  function scope(params) {
    const keys = ['from', 'to', 'tzOffset', 'fromTime', 'toTime', 'ip', 'path', 'status', 'bot', 'engine', 'kind'];
    const queryHash = createHash('sha256').update(JSON.stringify(keys.map((key) => [key, params.get(key) || '']))).digest('hex');
    const previous = params.get('cursor') ? decode(params.get('cursor')) : null;
    if (previous && previous.queryHash !== queryHash) throw queryError('篩選條件已改變，請重新查詢。');
    const { from, to } = previous || range(params);
    const span = new Date(to) - new Date(from);
    if (!Number.isFinite(span) || span <= 0 || span > LOG_LIMITS.rangeDays * 86400000) throw queryError(`請求紀錄單次查詢限 ${LOG_LIMITS.rangeDays} 天，請縮小日期區間。`);
    const maxId = previous?.maxId ?? db.prepare('SELECT COALESCE(MAX(id),0) id FROM analytics_requests').get().id;
    const filters = ['occurred_at>=?', 'occurred_at<?', 'id<=?'];
    const values = [from, to, maxId];
    const like = (value) => `%${String(value).trim().replace(/[\\%_]/g, '\\$&')}%`;
    for (const [name, column, length] of [['ip', 'ip', 64], ['path', 'path', 200]]) {
      if (params.get(name)) { filters.push(`${column} LIKE ? ESCAPE '\\'`); values.push(like(params.get(name).slice(0, length))); }
    }
    if (params.get('status')) {
      if (!/^[1-5]\d{2}$/.test(params.get('status'))) throw queryError('HTTP 狀態碼請輸入 100～599。');
      filters.push('status=?'); values.push(Number(params.get('status')));
    }
    const bot = params.get('bot');
    if (bot === 'admin' || bot === 'visitor') { filters.push('is_admin=?'); values.push(Number(bot === 'admin')); }
    if (['visitor', 'search_engine', 'other_bot', 'suspected_automation', 'unknown'].includes(bot)) { filters.push('bot_category=?'); values.push(bot); }
    if (['Google', 'Bing'].includes(params.get('engine'))) { filters.push('bot_engine=?'); values.push(params.get('engine')); }
    if (['api', 'page', 'static'].includes(params.get('kind'))) { filters.push('request_kind=?'); values.push(params.get('kind')); }
    const where = filters.join(' AND ');
    const total = previous?.total ?? db.prepare(`SELECT COUNT(*) count FROM analytics_requests WHERE ${where}`).get(...values).count;
    const snapshot = previous || { from, to, maxId, total, offset: 0, before: null, queryHash, at: new Date().toISOString(), expires: Date.now() + LOG_LIMITS.snapshotMinutes * 60000 };
    return { where, values, snapshot };
  }
  function rows(scope, before, limit) {
    const seek = before ? ' AND (occurred_at<? OR (occurred_at=? AND id<?))' : '';
    const args = before ? [before.time, before.time, before.id] : [];
    return db.prepare(`SELECT ${columns} FROM analytics_requests WHERE ${scope.where}${seek} ORDER BY occurred_at DESC,id DESC LIMIT ?`).all(...scope.values, ...args, limit);
  }
  function page(params) {
    const selected = scope(params);
    const { snapshot } = selected;
    const limit = Math.max(10, Math.min(LOG_LIMITS.pageRows, Number.parseInt(params.get('limit'), 10) || 50));
    const found = rows(selected, snapshot.before, limit + 1);
    const more = found.length > limit;
    const items = found.slice(0, limit);
    const last = items.at(-1);
    return { rows: items, total: snapshot.total, offset: snapshot.offset, limit, snapshotAt: snapshot.at, snapshotExpiresAt: new Date(snapshot.expires).toISOString(), startCursor: encode({ ...snapshot, offset: 0, before: null }), nextCursor: more && last ? encode({ ...snapshot, offset: snapshot.offset + items.length, before: { time: last.occurred_at, id: last.id } }) : null };
  }
  function prepareExport(params) {
    const selected = scope(params);
    if (selected.snapshot.total > LOG_LIMITS.exportRows) throw queryError(`匯出最多 ${LOG_LIMITS.exportRows.toLocaleString()} 筆，請縮小日期或篩選範圍。`, 413);
    // Conservative UTF-8 + CSV escaping estimate, checked before sending download headers.
    const size = db.prepare(`SELECT COALESCE(SUM(2*(length(CAST(path AS BLOB))+length(CAST(user_agent AS BLOB))+length(CAST(referer AS BLOB)))+512),0) bytes FROM analytics_requests WHERE ${selected.where}`).get(...selected.values).bytes;
    if (size + 1024 > LOG_LIMITS.exportBytes) throw queryError('匯出檔案預估超過 10 MB，請縮小篩選範圍。', 413);
    return { total: selected.snapshot.total, snapshotAt: selected.snapshot.at, *batches() {
      let before = null;
      while (true) {
        const batch = rows(selected, before, 200);
        if (!batch.length) break;
        yield batch;
        const last = batch.at(-1); before = { time: last.occurred_at, id: last.id };
      }
    } };
  }
  return { page, prepareExport };
}

// Prevent spreadsheet formula injection, including formulas hidden behind whitespace.
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[\s\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
export const CSV_HEADER = ['時間（UTC）', 'IP（遮罩）', '國家', 'Method', 'Path', 'Status', 'User-Agent', 'Referer', '請求類型', '管理者', '訪客分類', '搜尋引擎', '爬蟲宣稱', '已驗證', 'IP來源'].map(csvCell).join(',') + '\r\n';
export function csvRequest(row) {
  return [row.occurred_at, maskedIp(row.ip), row.country, row.method, row.path, row.status, row.user_agent, row.referer, row.request_kind, row.is_admin ? '是' : '否', row.bot_category, row.bot_engine, row.crawler_claimed, row.crawler_verified, row.ip_source].map(csvCell).join(',') + '\r\n';
}
