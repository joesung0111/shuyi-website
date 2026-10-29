import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT || 4173);
const ADMIN_PASSWORD = process.env.SHUYI_ADMIN_PASSWORD || 'shuyi-local-dev';
const SITE_ORIGIN = 'https://sy-body.com';
const GOOGLE_SITE_VERIFICATION = /^[A-Za-z0-9_-]+$/.test(process.env.GOOGLE_SITE_VERIFICATION || '') ? process.env.GOOGLE_SITE_VERIFICATION : '';
const googleVerificationMeta = GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${GOOGLE_SITE_VERIFICATION}">` : '';
const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]+$/i.test(process.env.GA4_MEASUREMENT_ID || '') ? process.env.GA4_MEASUREMENT_ID : '';
const ga4Boot = GA4_MEASUREMENT_ID ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4_MEASUREMENT_ID}');</script>` : '';
// Railway uses DATABASE_PATH on its mounted Volume (for example /data/shuyi.sqlite).
// Local development keeps the database in the project data folder.
const DB_PATH = resolve(process.env.DATABASE_PATH || join(ROOT, 'data', 'shuyi.sqlite'));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.ico': 'image/x-icon' };
const themeBoot = '<script>(function(){try{var t=localStorage.getItem("shuyi-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=t}catch(e){}}())<\/script>';
const headEnhancements = (admin = false) => `${admin ? '<link rel="icon" href="/admin/favicon.svg" type="image/svg+xml">' : '<link rel="icon" href="/素材/淺色系-1K.jpeg" type="image/jpeg">'}${themeBoot}`;
const withoutSloganStops = (html) => ['不只放鬆。', '動起來。', '自在的樣子。', '新的情報。', '工作室。', '自己。'].reduce((result, phrase) => result.replaceAll(phrase, phrase.slice(0, -1)), html);

mkdirSync(dirname(DB_PATH), { recursive: true });
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

// Editorial launch set: insert once so it reaches existing CMS databases on deploy
// without replacing any content already managed by the site owner.
const editorialArticles = JSON.parse(await readFile(join(ROOT, 'content', 'editorial-articles.json'), 'utf8'));
const editorialEvidence = JSON.parse(await readFile(join(ROOT, 'content', 'editorial-evidence.json'), 'utf8'));
const insertEditorial = db.prepare('INSERT OR IGNORE INTO content (title,slug,type,excerpt,body,video_url,cover_url,status,published_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,\'published\',?,?,?)');
for (const item of editorialArticles) {
  const timestamp = new Date(Date.now() - item.daysAgo * 86400000).toISOString();
  insertEditorial.run(item.title, item.slug, 'article', item.excerpt, item.body, '', item.cover_url, timestamp, timestamp, timestamp);
}

const json = (res, status, value) => { const body = JSON.stringify(value); res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(body); };
const readBody = async (req) => { let raw = ''; for await (const chunk of req) raw += chunk; if (!raw) return {}; try { return JSON.parse(raw); } catch { return null; } };
const sessionToken = (req) => /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1] || /(?:^|; )shuyi_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
const getSession = (req) => { const token = sessionToken(req); if (!token) return null; const session = db.prepare('SELECT token FROM admin_sessions WHERE token = ? AND expires_at > ?').get(token, now()); if (!session) db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token); return session; };
const requireAuth = (req, res) => { if (!getSession(req)) { json(res, 401, { error: '需要登入後台' }); return false; } return true; };
function youtubeEmbedUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0];
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  } catch { return null; }
}
const safeContent = (row) => ({ ...row, href: `/journal/${row.slug}/`, tag: row.type === 'article' ? 'BODY NOTE' : row.type === 'video' ? 'SHU YI FILM' : 'STUDIO NEWS', date: row.status === 'published' ? (row.published_at || '').slice(0, 10) : 'DRAFT', video: row.video_url || undefined, embed_url: youtubeEmbedUrl(row.video_url) || undefined, cover: row.cover_url || undefined, imageAlt: editorialEvidence[row.slug]?.imageAlt || '', accent: row.type === 'article' ? 'peach' : row.type === 'video' ? 'violet' : 'lime' });
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const bodyHtml = (body) => escapeHtml(body).split(/\n{2,}/).filter(Boolean).map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('') || '<p>內容準備中。</p>';
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const dateOnly = (value) => value ? String(value).slice(0, 10) : '';
const articleDescription = (row) => (row.excerpt || row.body || row.title).replace(/\s+/g, ' ').trim().slice(0, 300);
const cardHtml = (row) => {
  const item = safeContent(row);
  const title = escapeHtml(item.title);
  const cover = item.cover ? `<a class="card-art-link" href="${escapeHtml(item.href)}" aria-label="閱讀文章：${title}"><img class="card-cover" src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.imageAlt)}" loading="lazy"></a>` : '';
  const visual = cover || (item.type === 'video' ? `<span>VIDEO</span>` : `<span>${escapeHtml(item.type).toUpperCase()}</span>`);
  return `<article class="content-card content-card--${escapeHtml(item.accent)}" data-content-type="${escapeHtml(item.type)}"><div class="card-art">${visual}</div><div class="card-meta"><span>${escapeHtml(item.tag)}</span><span>${escapeHtml(item.date)}</span></div><h3>${title}</h3><p>${escapeHtml(item.excerpt)}</p><a href="${escapeHtml(item.href)}">閱讀內容 <span>→</span></a></article>`;
};
function pageSeo(pathname) {
  const normalized = pathname === '/' ? '/' : `${pathname.replace(/\/+$/, '')}/`;
  const routes = {
    '/': ['舒逸 Shu Yi｜美式活化槍全身調理・預約制', '舒逸提供美式活化槍全身調理，依身體當下感受與日常活動安排服務；了解服務方式、舒逸日常、工作室資訊與線上預約入口。'],
    '/services/': ['美式活化槍全身調理｜服務介紹｜舒逸 Shu Yi', '了解舒逸以美式活化槍為核心的全身活化調理服務理念與方式。'],
    '/offerings/': ['服務項目 活化調理與舒緩安排 舒逸 Shu Yi', '查看舒逸各項活化調理與舒緩服務的內容、時間與費用，依需求選擇適合的安排。'],
    '/booking/': ['舒逸預約｜全身活化調理線上預約入口', '查看舒逸全身活化調理的預約方式，並前往舒逸線上預約平台選擇服務與時段；預約平台另提供 AI 輔助問答。'],
    '/studio/': ['舒逸工作室｜預約制空間與到訪資訊', '認識舒逸工作室與目前公開的到訪資訊。工作室採預約制，地址與營業時段將於確認後公布。'],
    '/journal/': ['舒逸日常｜身體感受、活動與日常照顧', '舒逸日常整理身體感受、久坐、活動、休息與生活習慣相關內容，提供日常閱讀與自我照顧資訊。']
  };
  return { canonical: `${SITE_ORIGIN}${normalized}`, ...(routes[normalized] ? { title: routes[normalized][0], description: routes[normalized][1] } : {}) };
}
function addSeo(html, pathname) {
  const seo = pageSeo(pathname);
  if (seo.title) html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  if (seo.description) html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?\s*>/i, `<meta name="description" content="${escapeHtml(seo.description)}">`);
  const title = /<title>(.*?)<\/title>/i.exec(html)?.[1] || '舒逸 Shu Yi';
  const description = /<meta\s+name="description"\s+content="([^"]*)"/i.exec(html)?.[1] || '';
  const type = pathname === '/' ? 'website' : 'website';
  const schemas = [];
  if (pathname === '/') schemas.push({ '@context': 'https://schema.org', '@type': 'Organization', '@id': `${SITE_ORIGIN}/#organization`, name: '舒逸', alternateName: 'Shu Yi', url: `${SITE_ORIGIN}/`, description: '舒逸提供美式活化槍全身調理服務。' });
  if (pathname === '/services/') schemas.push({ '@context': 'https://schema.org', '@type': 'Service', name: '全身活化調理', provider: { '@id': `${SITE_ORIGIN}/#organization` }, url: `${SITE_ORIGIN}/services/`, description: '舒逸以美式活化槍為核心，依身體當下的感受與日常活動安排調理。' });
  if (pathname !== '/') {
    const label = pathname === '/services/' ? '活化調理' : pathname === '/offerings/' ? '服務項目' : pathname === '/booking/' ? '預約' : pathname === '/studio/' ? '工作室' : '舒逸日常';
    schemas.push({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: label, item: seo.canonical }] });
  }
  const tags = `${googleVerificationMeta}<link rel="canonical" href="${escapeHtml(seo.canonical)}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${escapeHtml(seo.canonical)}"><meta property="og:type" content="${type}"><meta property="og:image" content="${SITE_ORIGIN}/素材/淺色系-1K.jpeg">${schemas.map((schema) => `<script type="application/ld+json">${jsonLd(schema)}</script>`).join('')}${ga4Boot}`;
  return html.replace('</head>', `${tags}</head>`);
}

function sitemapXml() {
  const fixed = ['/', '/services/', '/offerings/', '/journal/', '/studio/', '/booking/'];
  const rows = db.prepare("SELECT slug, updated_at, published_at FROM content WHERE status = 'published' ORDER BY COALESCE(published_at, updated_at) DESC").all();
  const urls = [...fixed.map((loc) => ({ loc: `${SITE_ORIGIN}${loc}` })), ...rows.map((row) => ({ loc: `${SITE_ORIGIN}/journal/${encodeURIComponent(row.slug)}/`, lastmod: dateOnly(row.updated_at || row.published_at) }))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({ loc, lastmod }) => `<url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`).join('')}</urlset>`;
}

function articlePage(row) {
  const type = row.type === 'article' ? '文章' : row.type === 'video' ? '影片' : '情報';
  const canonical = `${SITE_ORIGIN}/journal/${encodeURIComponent(row.slug)}/`;
  const description = articleDescription(row);
  const published = row.published_at || row.created_at;
  const modified = row.updated_at || published;
  const image = row.cover_url ? new URL(row.cover_url, SITE_ORIGIN).href : `${SITE_ORIGIN}/素材/淺色系-1K.jpeg`;
  const schema = { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: row.title, description, datePublished: published, dateModified: modified, author: { '@type': 'Organization', name: '舒逸', '@id': `${SITE_ORIGIN}/#organization` }, publisher: { '@type': 'Organization', name: '舒逸', '@id': `${SITE_ORIGIN}/#organization` }, mainEntityOfPage: canonical, url: canonical, image };
  const embedUrl = youtubeEmbedUrl(row.video_url);
  const video = embedUrl ? `<figure class="article-video"><iframe src="${escapeHtml(embedUrl)}" title="${escapeHtml(row.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></figure>` : row.video_url ? `<figure class="article-video"><video controls playsinline src="${escapeHtml(row.video_url)}"></video></figure>` : '';
  const cover = row.cover_url ? `<img class="article-cover" src="${escapeHtml(row.cover_url)}" alt="${escapeHtml(editorialEvidence[row.slug]?.imageAlt || '')}">` : '';
  const contentCard = (label, href, event) => `<a data-${event}="true" href="${href}">${label}</a>`;
  const evidence = editorialEvidence[row.slug] || { kind: '資料與審閱資訊待確認', basis: '本篇尚未登錄可核對的資料來源；請內容提供者先確認文字與依據。', boundary: '審核完成前，請勿將本篇內容視為健康指引、醫療資訊或治療建議。', review: '尚無審閱紀錄。', sources: [] };
  const evidenceHtml = evidence ? `<section class="article-evidence" aria-labelledby="article-evidence-title"><h2 id="article-evidence-title">資料來源與內容界線</h2><p><strong>內容性質：</strong>${escapeHtml(evidence.kind)}</p><p><strong>資料依據：</strong>${escapeHtml(evidence.basis)}</p><p><strong>醫療界線：</strong>${escapeHtml(evidence.boundary)}</p><p><strong>專業審閱：</strong>${escapeHtml(evidence.review)}</p>${evidence.sources.length ? `<h3>參考資料</h3><ul>${evidence.sources.map((source) => `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.title)} ↗</a></li>`).join('')}</ul>` : '<p>本篇沒有引用醫療或科學研究；內容為一般生活建議。</p>'}<p class="article-evidence__date">參考資料連結檢視日期：2026-10-27</p></section>` : '';
  const articleHtml = `<!doctype html><html lang="zh-Hant"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(description)}"><title>${escapeHtml(row.title)}｜舒逸日常</title>${googleVerificationMeta}<link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(row.title)}｜舒逸日常"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="article"><meta property="og:image" content="${escapeHtml(image)}">${ga4Boot}<script type="application/ld+json">${jsonLd(schema)}</script><script type="application/ld+json">${jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '首頁', item: `${SITE_ORIGIN}/` }, { '@type': 'ListItem', position: 2, name: '舒逸日常', item: `${SITE_ORIGIN}/journal/` }, { '@type': 'ListItem', position: 3, name: row.title, item: canonical }] })}</script><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Noto+Sans+TC:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/styles.css"></head><body><header class="site-header"><a class="brand" href="/" aria-label="舒逸首頁"><img class="brand-logo brand-logo--light" src="/素材/淺色系-1K.jpeg" alt="舒逸 Shu Yi"><img class="brand-logo brand-logo--dark" src="/素材/深色系-1K.jpeg" alt="" aria-hidden="true"><span>SHU YI</span></a><nav class="site-nav" aria-label="主要導覽"><a href="/services/">活化調理</a><a href="/journal/" aria-current="page">舒逸日常</a><a href="/studio/">工作室</a><a href="/booking/">預約</a></nav><div class="header-actions"><button class="theme-switch" type="button" aria-label="切換深淺色主題" aria-pressed="false"><span class="theme-switch__dot"></span><span class="theme-switch__label">LIGHT</span></button><button class="menu-button" type="button" aria-label="開啟選單" aria-expanded="false"><span></span><span></span></button></div></header><main class="article"><a class="back-link" href="/journal/#journal-return">← 回到舒逸日常</a><div class="article-meta"><span>${type}</span><span>發布日期：${escapeHtml(dateOnly(published))}</span><span>最後更新：${escapeHtml(dateOnly(modified))}</span><span>內容提供：舒逸</span></div><h1>${escapeHtml(row.title)}</h1>${cover}${video}<div class="article-body">${bodyHtml(row.body)}</div>${evidenceHtml}<section class="article-related"><h2>相關內容</h2><p>深入了解舒逸全身活化調理服務。</p>${contentCard('了解舒逸全身活化調理', '/services/', 'journal-to-service')}　${contentCard('前往預約', '/booking/', 'journal-to-booking')}</section></main><footer class="site-footer"><a class="brand" href="/"><span>舒逸</span><small>SHU YI</small></a><p>© 2026 SHU YI. MOVE WELL, LIVE LIGHT.</p><div><a href="/journal/">JOURNAL</a><a href="/booking/">BOOKING</a></div></footer><script src="/app.js"></script></body></html>`;
  return articleHtml;
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
  let clean = decodeURIComponent(pathname);
  if (clean === '/') clean = '/index.html';
  if (clean.endsWith('/')) clean += 'index.html';
  const filePath = resolve(ROOT, `.${normalize(clean)}`);
  if (!filePath.startsWith(ROOT) || relative(ROOT, filePath).startsWith('..')) return json(res, 403, { error: 'Forbidden' });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return json(res, 404, { error: 'Not found' });
    const extension = extname(filePath);
    const contentType = mime[extension] || 'application/octet-stream';

    // Safari requests video in byte ranges. Returning the whole MP4 works in
    // Chromium, but can leave Safari playing only the first buffered segment.
    if (extension === '.mp4') {
      const total = info.size;
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (!match || (!match[1] && !match[2])) {
          res.writeHead(416, { 'content-range': `bytes */${total}` });
          return res.end();
        }
        const start = match[1] ? Number(match[1]) : Math.max(total - Number(match[2]), 0);
        const end = match[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
        if (start < 0 || start >= total || end < start) {
          res.writeHead(416, { 'content-range': `bytes */${total}` });
          return res.end();
        }
        res.writeHead(206, {
          'accept-ranges': 'bytes',
          'content-type': contentType,
          'content-length': end - start + 1,
          'content-range': `bytes ${start}-${end}/${total}`,
          'cache-control': 'public, max-age=3600'
        });
        return createReadStream(filePath, { start, end }).pipe(res);
      }
      res.writeHead(200, { 'accept-ranges': 'bytes', 'content-type': contentType, 'content-length': total, 'cache-control': 'public, max-age=3600' });
      return createReadStream(filePath).pipe(res);
    }

    if (extension === '.html') {
      let html = (await readFile(filePath, 'utf8')).replace('MOVE WELL, LIVE LIGHT.', 'MOVE WELL, LIVE LIGHT');
      if (clean === '/journal/index.html') {
        const published = db.prepare("SELECT * FROM content WHERE status = 'published' ORDER BY COALESCE(published_at, updated_at) DESC").all();
        html = html.replace('<div class="content-grid" id="content-grid" aria-live="polite"></div>', `<div class="content-grid" id="content-grid" aria-live="polite">${published.map(cardHtml).join('')}</div>`);
      }
      if (!clean.startsWith('/admin/')) html = addSeo(html, clean.endsWith('/index.html') ? clean.slice(0, -'index.html'.length) : clean);
      res.writeHead(200, { 'content-type': contentType });
      return res.end(withoutSloganStops(html.replace('</head>', `${headEnhancements(clean.startsWith('/admin/'))}</head>`)));
    }
    const file = await readFile(filePath);
    res.writeHead(200, { 'content-type': contentType });
    res.end(file);
  } catch { if (!res.headersSent) json(res, 404, { error: 'Not found' }); else res.end(); }
}

function dynamicArticle(req, res, pathname) {
  if (req.method !== 'GET') return false;
  const match = pathname.match(/^\/journal\/([a-z0-9-]+)\/?$/);
  if (!match) return false;
  const row = db.prepare("SELECT * FROM content WHERE slug = ? AND status = 'published'").get(match[1]);
  if (!row) return false;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(articlePage(row).replace('MOVE WELL, LIVE LIGHT.', 'MOVE WELL, LIVE LIGHT').replace('</head>', `${headEnhancements()}</head>`));
  return true;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.hostname.toLowerCase() === 'www.sy-body.com') {
      res.writeHead(308, { location: `https://sy-body.com${url.pathname}${url.search}` });
      return res.end();
    }
    if (req.method === 'GET' && url.pathname === '/robots.txt') {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end(`User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nUser-agent: OAI-SearchBot\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nUser-agent: GPTBot\nDisallow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`);
    }
    if (req.method === 'GET' && url.pathname === '/sitemap.xml') {
      res.writeHead(200, { 'content-type': 'application/xml; charset=utf-8' });
      return res.end(sitemapXml());
    }
    if (req.method === 'GET' && url.pathname === '/index.html') { res.writeHead(308, { location: '/' }); return res.end(); }
    const pageAlias = url.pathname.match(/^\/(services|offerings|journal|studio|booking)$/);
    if (req.method === 'GET' && pageAlias) { res.writeHead(308, { location: `${url.pathname}/${url.search}` }); return res.end(); }
    const staticAlias = url.pathname.match(/^\/(services|offerings|journal|studio|booking)\/index\.html$/);
    if (req.method === 'GET' && staticAlias) { res.writeHead(308, { location: `/${staticAlias[1]}/${url.search}` }); return res.end(); }
    const articleAlias = url.pathname.match(/^\/journal\/([a-z0-9-]+)$/);
    if (req.method === 'GET' && articleAlias) { res.writeHead(308, { location: `${url.pathname}/${url.search}` }); return res.end(); }
    const articleIndexAlias = url.pathname.match(/^\/journal\/([a-z0-9-]+)\/index\.html$/);
    if (req.method === 'GET' && articleIndexAlias) { res.writeHead(308, { location: `/journal/${articleIndexAlias[1]}/${url.search}` }); return res.end(); }
    if (url.pathname === '/admin' || url.pathname === '/admin/dashboard') { res.writeHead(308, { location: `${url.pathname}/` }); return res.end(); }
    const handled = await api(req, res, url);
    if (!handled) {
      if (dynamicArticle(req, res, url.pathname)) return;
      if (req.method === 'GET' && /^\/journal\/[a-z0-9-]+\/$/.test(url.pathname)) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      if (url.pathname === '/admin/' || url.pathname === '/admin/dashboard/') url.pathname = '/admin/index.html';
      if (url.pathname === '/admin/dashboard/admin.css') url.pathname = '/admin/admin.css';
      if (url.pathname === '/admin/dashboard/admin.js') url.pathname = '/admin/admin.js';
      await staticFile(req, res, url.pathname);
    }
  } catch (error) { console.error(error); if (!res.headersSent) json(res, 500, { error: '伺服器發生錯誤' }); }
}).listen(PORT, () => { console.log(`舒逸網站：http://localhost:${PORT}`); console.log(`後台：http://localhost:${PORT}/admin/`); if (!process.env.SHUYI_ADMIN_PASSWORD) console.warn('未設定 SHUYI_ADMIN_PASSWORD，開發密碼為 shuyi-local-dev；正式環境請務必設定環境變數。'); });
