import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.SHUYI_ADMIN_PASSWORD || 'shuyi-local-dev';
const DB_PATH = join(ROOT, 'data', 'shuyi.sqlite');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };

mkdirSync(join(ROOT, 'data'), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec(`CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, type TEXT NOT NULL CHECK(type IN ('article','video','news')), excerpt TEXT NOT NULL DEFAULT '', body TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '', cover_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')), published_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`);
db.exec(`CREATE TABLE IF NOT EXISTS admin_sessions (token TEXT PRIMARY KEY, expires_at TEXT NOT NULL, created_at TEXT NOT NULL)`);
const now = () => new Date().toISOString();
const seed = [
  ['久坐後的緊繃感，從哪裡開始聽？','activate-after-sitting','article','一段給日常身體感受的小筆記。','不是每一次卡住，都需要立刻處理。先停一秒，感受今天的肩、背、髖正在告訴你什麼。','', '', 'draft'],
  ['舒逸的第一個呼吸練習','first-breath','video','跟著影片，留一分鐘給自己。','留一分鐘，不必把事情做好，只要把注意力放回呼吸與身體。','/素材/單純動畫-02.mp4','', 'published'],
  ['舒逸工作室，正在慢慢成形','studio-in-progress','news','新空間、新服務與我們想分享的事。','新空間、新服務與我們想分享的事，之後都會在這裡留下紀錄。','','','draft']
];
if (db.prepare('SELECT COUNT(*) AS count FROM content').get().count === 0) {
  const insert = db.prepare('INSERT INTO content (title,slug,type,excerpt,body,video_url,cover_url,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)');
  const timestamp = now(); seed.forEach((item) => insert.run(...item, item[7] === 'published' ? timestamp : null, timestamp, timestamp));
}

const json = (res, status, value) => { const body = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(body); };
const readBody = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; if (!raw) return {}; try { return JSON.parse(raw); } catch { return null; } };
const sessionToken = (req) => /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1] || /(?:^|; )shuyi_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
const getSession = (req) => { const token = sessionToken(req); if (!token) return null; const session = db.prepare('SELECT token FROM admin_sessions WHERE token = ? AND expires_at > ?').get(token, now()); if (!session) db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token); return session; };
const requireAuth = (req, res) => { if (!getSession(req)) { json(res, 401, { error: '需要登入後台' }); return false; } return true; };
const safeContent = (row) => ({ ...row, href: `/journal/${row.slug}/`, tag: row.type === 'article' ? 'BODY NOTE' : row.type === 'video' ? 'SHU YI FILM' : 'STUDIO NEWS', date: row.status === 'published' ? (row.published_at || '').slice(0, 10) : 'DRAFT', video: row.video_url || undefined, accent: row.type === 'article' ? 'peach' : row.type === 'video' ? 'violet' : 'lime' });

async function api(req, res, url) {
  if (req.method === 'POST' && url.pathname === '/api/admin/login') {
    const body = await readBody(req); if (!body || body.password !== ADMIN_PASSWORD) return json(res, 401, { error: '密碼不正確' });
    const token = randomBytes(32).toString('hex'); const createdAt = now(); const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); db.prepare('DELETE FROM admin_sessions WHERE expires_at <= ?').run(createdAt); db.prepare('INSERT INTO admin_sessions (token,expires_at,created_at) VALUES (?,?,?)').run(token, expiresAt, createdAt); res.setHeader('Set-Cookie', `shuyi_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`); return json(res, 200, { ok: true, token });
  }
  if (req.method === 'POST' && url.pathname === '/api/admin/logout') { const token = sessionToken(req); if (token) db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token); res.setHeader('Set-Cookie', 'shuyi_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'); return json(res, 200, { ok: true }); }
  if (!url.pathname.startsWith('/api/')) return false;
  if (url.pathname === '/api/content' && req.method === 'GET') { const publishedOnly = url.searchParams.get('status') === 'published'; const rows = db.prepare(`SELECT * FROM content ${publishedOnly ? "WHERE status = 'published'" : ''} ORDER BY COALESCE(published_at, updated_at) DESC`).all(); return json(res, 200, rows.map(safeContent)); }
  if (!requireAuth(req, res)) return true;
  if (url.pathname === '/api/admin/session' && req.method === 'GET') return json(res, 200, { authenticated: true });
  if (url.pathname === '/api/content' && req.method === 'POST') { const body = await readBody(req); if (!body?.title || !body?.slug || !['article','video','news'].includes(body.type)) return json(res, 400, { error: '標題、網址代稱與類型為必填' }); const timestamp = now(); try { const result = db.prepare('INSERT INTO content (title,slug,type,excerpt,body,video_url,cover_url,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(body.title.trim(), body.slug.trim(), body.type, body.excerpt || '', body.body || '', body.video_url || '', body.cover_url || '', body.status === 'published' ? 'published' : 'draft', body.status === 'published' ? timestamp : null, timestamp, timestamp); return json(res, 201, safeContent(db.prepare('SELECT * FROM content WHERE id = ?').get(result.lastInsertRowid))); } catch (error) { return json(res, 409, { error: error.message.includes('UNIQUE') ? '網址代稱已存在' : '無法建立內容' }); } }
  const match = url.pathname.match(/^\/api\/content\/(\d+)$/); if (match) { const id = Number(match[1]); if (req.method === 'GET') return json(res, 200, safeContent(db.prepare('SELECT * FROM content WHERE id = ?').get(id) || {})); if (req.method === 'PUT') { const body = await readBody(req); const current = db.prepare('SELECT * FROM content WHERE id = ?').get(id); if (!current) return json(res, 404, { error: '找不到內容' }); if (!body?.title || !body?.slug || !['article','video','news'].includes(body.type)) return json(res, 400, { error: '標題、網址代稱與類型為必填' }); const status = body.status === 'published' ? 'published' : 'draft'; const publishedAt = status === 'published' ? (current.published_at || now()) : null; try { db.prepare('UPDATE content SET title=?,slug=?,type=?,excerpt=?,body=?,video_url=?,cover_url=?,status=?,published_at=?,updated_at=? WHERE id=?').run(body.title.trim(), body.slug.trim(), body.type, body.excerpt || '', body.body || '', body.video_url || '', body.cover_url || '', status, publishedAt, now(), id); return json(res, 200, safeContent(db.prepare('SELECT * FROM content WHERE id = ?').get(id))); } catch (error) { return json(res, 409, { error: error.message.includes('UNIQUE') ? '網址代稱已存在' : '無法更新內容' }); } } if (req.method === 'DELETE') { db.prepare('DELETE FROM content WHERE id = ?').run(id); return json(res, 200, { ok: true }); } }
  return json(res, 404, { error: 'API route not found' });
}

async function staticFile(req, res, pathname) {
  let clean = decodeURIComponent(pathname); if (clean === '/') clean = '/index.html'; if (clean.endsWith('/')) clean += 'index.html'; const filePath = resolve(ROOT, `.${normalize(clean)}`); if (!filePath.startsWith(ROOT) || relative(ROOT, filePath).startsWith('..')) return json(res, 403, { error: 'Forbidden' }); try { const info = await stat(filePath); if (!info.isFile()) return json(res, 404, { error: 'Not found' }); res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' }); res.end(await readFile(filePath)); } catch { json(res, 404, { error: 'Not found' }); }
}

createServer(async (req, res) => { const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); try { if (url.pathname === '/admin' || url.pathname === '/admin/dashboard') { res.writeHead(308, { location: `${url.pathname}/` }); return res.end(); } const handled = await api(req, res, url); if (!handled) { if (url.pathname === '/admin/' || url.pathname === '/admin/dashboard/') url.pathname = '/admin/index.html'; if (url.pathname === '/admin/dashboard/admin.css') url.pathname = '/admin/admin.css'; if (url.pathname === '/admin/dashboard/admin.js') url.pathname = '/admin/admin.js'; await staticFile(req, res, url.pathname); } } catch (error) { console.error(error); if (!res.headersSent) json(res, 500, { error: '伺服器發生錯誤' }); } }).listen(PORT, () => { console.log(`舒逸網站：http://localhost:${PORT}`); console.log(`後台：http://localhost:${PORT}/admin/`); if (!process.env.SHUYI_ADMIN_PASSWORD) console.warn('未設定 SHUYI_ADMIN_PASSWORD，開發密碼為 shuyi-local-dev；正式環境請務必設定環境變數。'); });
