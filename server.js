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
const safeContent = (row) => ({ ...row, href: `/journal/${row.slug}/`, tag: row.type === 'article' ? 'BODY NOTE' : row.type === 'video' ? 'SHU YI FILM' : 'STUDIO NEWS', date: row.status === 'published' ? (row.published_at || '').slice(0, 10) : 'DRAFT', video: row.video_url || undefined, cover: row.cover_url || undefined, accent: row.type === 'article' ? 'peach' : row.type === 'video' ? 'violet' : 'lime' });
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const bodyHtml = (body) => escapeHtml(body).split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('') || '<p>內容準備中。</p>';

function articlePage(row) {
  const type = row.type === 'article' ? '文章' : row.type === 'video' ? '影片' : '情報';
  const video = row.video_url ? `<figure class="article-video"><video controls playsinline src="${escapeHtml(row.video_url)}"></video></figure>` : '';
  const cover = row.cover_url ? `<img class="article-cover" src="${escapeHtml(row.cover_url)}" alt="${escapeHtml(row.title)}">` : '';
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(row.excerpt || row.title)}"><title>${escapeHtml(row.title)}｜舒逸 Shu Yi</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"></head><body><header class="site-header"><a class="brand" href="/" aria-label="舒逸首頁"><img class="brand-logo brand-logo--light" src="/素材/淺色系-1K.jpeg" alt="舒逸 Shu Yi"><img class="brand-logo brand-logo--dark" src="/素材/深色系-1K.jpeg" alt="" aria-hidden="true"><span>SHU YI</span></a><nav class="site-nav" aria-label="主要導覽"><a href="/services/">活化調理</a><a href="/journal/" aria-current="page">舒逸日常</a><a href="/studio/">工作室</a><a href="/booking/">預約</a></nav><div class="header-actions"><button class="theme-switch" type="button" aria-label="切換深淺色主題" aria-pressed="false"><span class="theme-switch__dot"></span><span class="theme-switch__label">LIGHT</span></button><button class="menu-button" type="button" aria-label="開啟選單" aria-expanded="false"><span></span><span></span></button></div></header><main class="article"><a class="back-link" href="/journal/">← 回到舒逸日常</a><div class="article-meta"><span>${type}</span><span>${escapeHtml((row.published_at || row.updated_at || '').slice(0, 10))}</span></div><h1>${escapeHtml(row.title)}</h1>${cover}${video}<div class="article-body">${bodyHtml(row.body)}</div></main><footer class="site-footer"><a class="brand" href="/"><span>舒逸</span><small>SHU YI</small></a><p>© 2026 SHU YI. MOVE WELL, LIVE LIGHT.</p><div><a href="/journal/">JOURNAL</a><a href="/booking/">BOOKING</a></div></footer><script src="/app.js"></script></body></html>`;
}

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

function dynamicArticle(req, res, pathname) {
  if (req.method !== 'GET') return false;
  const match = pathname.match(/^\/journal\/([a-z0-9-]+)\/?$/);
  if (!match) return false;
  const row = db.prepare("SELECT * FROM content WHERE slug = ? AND status = 'published'").get(match[1]);
  if (!row) return false;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(articlePage(row));
  return true;
}

createServer(async (req, res) => { const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`); try { if (url.pathname === '/admin' || url.pathname === '/admin/dashboard') { res.writeHead(308, { location: `${url.pathname}/` }); return res.end(); } const handled = await api(req, res, url); if (!handled && !dynamicArticle(req, res, url.pathname)) { if (url.pathname === '/admin/' || url.pathname === '/admin/dashboard/') url.pathname = '/admin/index.html'; if (url.pathname === '/admin/dashboard/admin.css') url.pathname = '/admin/admin.css'; if (url.pathname === '/admin/dashboard/admin.js') url.pathname = '/admin/admin.js'; await staticFile(req, res, url.pathname); } } catch (error) { console.error(error); if (!res.headersSent) json(res, 500, { error: '伺服器發生錯誤' }); } }).listen(PORT, () => { console.log(`舒逸網站：http://localhost:${PORT}`); console.log(`後台：http://localhost:${PORT}/admin/`); if (!process.env.SHUYI_ADMIN_PASSWORD) console.warn('未設定 SHUYI_ADMIN_PASSWORD，開發密碼為 shuyi-local-dev；正式環境請務必設定環境變數。'); });
