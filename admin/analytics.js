const $ = (selector) => document.querySelector(selector);
const tokenKey = 'shuyi_admin_token';
const state = { bot: '', engine: '', requestPage: 1, requestTimer: 0, visitorTimer: 0, range: '', visitorRows: [], visitorPage: 1, visitorDevice: '', visitorSort: 'last_seen', visitorDirection: -1 };
const loginView = $('#login-view'); const appView = $('#app-view'); const pathDialog = $('#path-dialog');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const prettyTime = (value) => value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '—';
const eventLabel = (name) => ({ booking_cta_click: '預約按鈕', booking_platform_outbound: '開啟預約平台', line_click: 'LINE 連結', video_play: '影片播放', video_complete: '影片看完', video_open: '開啟外部影片', booking_submit_success: '預約成功（平台回報）', form_submit_success: '表單成功送出', journal_to_service: '文章前往服務頁', journal_to_booking: '文章前往預約頁' }[name] || name);
const duration = (seconds) => { const n = Math.max(0, Number(seconds) || 0); return n < 60 ? `${n} 秒` : `${Math.floor(n / 60)} 分 ${Math.round(n % 60)} 秒`; };
const ipMask = (ip) => { if (!ip) return '—'; if (ip.includes(':')) { const [left, right = ''] = ip.toLowerCase().split('::'); const a = left ? left.split(':') : []; const b = right ? right.split(':') : []; const groups = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : ip.split(':'); const first = groups.slice(0, 4); return first.every((part) => !parseInt(part || '0', 16)) ? '::' : `${first.join(':')}::`; } const p = ip.split('.'); return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : '—'; };
const ipSourceLabel = (source) => ({ socket: '直接連線', 'railway-x-real-ip': 'Railway', cloudflare: 'Cloudflare', 'unresolved-proxy': '代理來源待確認', legacy: '舊紀錄' }[source] || '未知');
const displayIp = (ip) => $('#show-full-ip')?.checked ? (ip || '—') : ipMask(ip);
async function request(url, options = {}) {
  const token = sessionStorage.getItem(tokenKey);
  const response = await fetch(url, { headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }, ...options });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(result.error || '讀取失敗'); }
  return result;
}
function showLogin() { loginView.hidden = false; loginView.style.display = 'grid'; appView.hidden = true; appView.style.display = 'none'; }
function showApp() { loginView.hidden = true; loginView.style.display = 'none'; appView.hidden = false; appView.style.display = 'block'; refresh(); }
async function checkSession() { try { await request('/api/admin/session'); showApp(); } catch { showLogin(); } }
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); $('#login-error').textContent = '';
  try { const result = await request('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: new FormData(event.currentTarget).get('password') }) }); sessionStorage.setItem(tokenKey, result.token); showApp(); }
  catch (error) { $('#login-error').textContent = error.message; }
});
$('#logout-button').addEventListener('click', async () => { try { await request('/api/admin/logout', { method: 'POST' }); } catch {} sessionStorage.removeItem(tokenKey); showLogin(); });
function rangeQuery() { return new URLSearchParams({ from: $('#date-from').value, to: $('#date-to').value, fullIp: $('#show-full-ip').checked ? '1' : '0', tzOffset: String(new Date().getTimezoneOffset()) }); }
function visitorUrl() { const query = rangeQuery(); query.set('page', state.visitorPage); query.set('limit', 50); if ($('#visitor-search').value.trim()) query.set('q', $('#visitor-search').value.trim()); return `/api/analytics/visitors?${query}`; }
function setRange(kind) {
  const today = new Date(); const from = new Date(today); const to = new Date(today);
  if (kind === 'yesterday') { from.setDate(from.getDate() - 1); to.setDate(to.getDate() - 1); }
  else if (kind === '7') from.setDate(from.getDate() - 6);
  else if (kind === '30') from.setDate(from.getDate() - 29);
  $('#date-from').value = localDate(from); $('#date-to').value = localDate(to); state.range = kind;
  $('#request-from-time').value = ''; $('#request-to-time').value = '';
  state.visitorPage = 1; state.requestPage = 1;
  document.querySelectorAll('[data-range]').forEach((button) => button.classList.toggle('is-active', button.dataset.range === kind));
}
document.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => { setRange(button.dataset.range); refresh(); }));
$('#apply-range').addEventListener('click', () => { state.range = ''; state.visitorPage = 1; state.requestPage = 1; $('#request-from-time').value = ''; $('#request-to-time').value = ''; document.querySelectorAll('[data-range]').forEach((button) => button.classList.remove('is-active')); refresh(); });
$('#date-from').value = localDate(); $('#date-to').value = localDate();
document.querySelector('[data-range="today"]').classList.add('is-active'); state.range = 'today';
function renderMetrics(data) {
  const cards = [['不重複訪客', data.visitors], ['總請求', data.requests], ['頁面瀏覽', data.pageviews], ['工作階段', data.sessions], ['平均停留', duration(data.avg_duration)], ['搜尋爬蟲', data.crawlers], ['其他 Bot', data.other_bots], ['HTTP 錯誤（4xx/5xx）', data.errors], ['管理者請求', data.admin_requests]];
  $('#metrics').innerHTML = cards.map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml((Number(value) || 0).toLocaleString('zh-TW'))}</strong></article>`).join('');
}
function renderTrend(rows) {
  const chart = $('#trend-chart');
  if (!rows.length) { chart.innerHTML = '<p class="empty-row">此區間尚無紀錄</p>'; return; }
  const max = Math.max(1, ...rows.flatMap((row) => [row.visitors, row.pageviews, row.requests, row.crawlers].map(Number)));
  chart.innerHTML = rows.map((row) => {
    const label = row.bucket.length > 10 ? row.bucket.slice(5, 13) : row.bucket.slice(5);
    const values = [row.visitors, row.pageviews, row.requests, row.crawlers];
    return `<div class="trend-group" aria-label="${escapeHtml(row.bucket)}"><span class="trend-label">${escapeHtml(label)}</span>${values.map((value) => `<i class="trend-bar" style="height:${Math.max(Number(value) ? 2 : 0, Number(value) / max * 100)}%" title="${Number(value) || 0}"></i>`).join('')}</div>`;
  }).join('');
}
function renderVisitors(rows) {
  const body = $('#visitors-body');
  state.visitorRows = rows;
  const visibleRows = rows.filter((row) => !state.visitorDevice || row.device === state.visitorDevice).sort((a, b) => {
    const field = state.visitorSort; const av = ['pageviews', 'sessions'].includes(field) ? Number(a[field]) : String(a[field] || '').toLowerCase(); const bv = ['pageviews', 'sessions'].includes(field) ? Number(b[field]) : String(b[field] || '').toLowerCase();
    return (av < bv ? -1 : av > bv ? 1 : 0) * state.visitorDirection;
  });
  const label = (row) => row.is_admin ? '管理者' : row.bot_engine ? `${row.bot_engine}（UA 宣稱）` : ({ visitor: '一般訪客', search_engine: '搜尋爬蟲（UA 宣稱）', other_bot: '其他 Bot', suspected_automation: '疑似自動化', unknown: '無法判定' }[row.bot_category] || '無法判定');
  body.innerHTML = visibleRows.length ? visibleRows.map((row) => `<tr><td>${escapeHtml(prettyTime(row.last_seen))}</td><td title="${escapeHtml(ipSourceLabel(row.ip_source))}"><code>${escapeHtml(row.ip_source === 'legacy' && row.ip?.startsWith('100.64.') ? '代理 IP（舊紀錄）' : displayIp(row.ip))}</code></td><td>${escapeHtml(row.country || '—')}</td><td>${escapeHtml(row.device || '—')}</td><td>${escapeHtml(row.browser || '—')}</td><td>${escapeHtml(row.referrer ? new URL(row.referrer).hostname : '直接進站')}</td><td>${Number(row.pageviews) || 0}</td><td>${Number(row.sessions) || 0}</td><td>${escapeHtml(label(row))}</td><td><button class="journey-button" data-session="${escapeHtml(row.latest_session)}">查看路徑</button></td></tr>`).join('') : '<tr><td colspan="10" class="empty-row">此區間尚無符合條件的訪客</td></tr>';
  $('#visitors-page').textContent = `第 ${state.visitorPage} 頁`;
  $('#visitors-prev').disabled = state.visitorPage <= 1;
  $('#visitors-next').disabled = rows.length < 50;
}
const categoryLabel = (row) => row.is_admin ? '管理者' : row.bot_engine ? `${row.bot_engine}（${row.crawler_verified ? '已驗證' : '未驗證'}）` : ({ visitor: '一般訪客', other_bot: '其他 Bot', suspected_automation: '疑似自動化', unknown: '無法判定', search_engine: '搜尋引擎爬蟲' }[row.bot_category] || row.bot_category);
function requestQuery() {
  const query = rangeQuery(); query.set('page', state.requestPage); query.set('limit', 50);
  const fromTime = $('#request-from-time').value; const toTime = $('#request-to-time').value;
  if (fromTime) query.set('fromTime', fromTime); if (toTime) query.set('toTime', toTime);
  const ip = $('#request-ip').value.trim(); const path = $('#request-path').value.trim(); const status = $('#request-status').value.trim();
  if (ip) query.set('ip', ip); if (path) query.set('path', path); if (/^\d{3}$/.test(status)) query.set('status', status);
  if (state.bot) query.set('bot', state.bot); if (state.engine) query.set('engine', state.engine);
  return query;
}
function renderRequests(rows, append = false) {
  const body = $('#requests-body');
  const html = rows.map((row) => `<tr><td>${escapeHtml(prettyTime(row.occurred_at))}</td><td title="${escapeHtml(ipSourceLabel(row.ip_source))}"><code>${escapeHtml(row.ip_source === 'legacy' && row.ip?.startsWith('100.64.') ? '代理 IP（舊紀錄）' : displayIp(row.ip))}</code></td><td>${escapeHtml(row.method)}</td><td><code>${escapeHtml(row.path)}</code></td><td class="status-code ${row.status >= 400 ? 'error' : ''}">${Number(row.status)}</td><td title="${escapeHtml(row.user_agent)}">${escapeHtml(row.user_agent.slice(0, 96))}</td><td>${escapeHtml(row.referer || '—')}</td><td>${escapeHtml(categoryLabel(row))}</td></tr>`).join('');
  if (!append) body.innerHTML = '';
  body.insertAdjacentHTML('beforeend', html || (!append ? '<tr><td colspan="8" class="empty-row">此區間尚無請求紀錄</td></tr>' : ''));
  $('#request-count').textContent = `${body.querySelectorAll('tr').length} 筆已載入`;
  $('#requests-more').hidden = rows.length < 50;
}
function renderCrawlers(data) {
  const byEngine = new Map();
  for (const row of data.daily) { const item = byEngine.get(row.engine) || { requests: 0, verified: 0, errors: 0 }; item.requests += Number(row.requests) || 0; item.verified += Number(row.verified) || 0; item.errors += Number(row.errors) || 0; byEngine.set(row.engine, item); }
  for (const item of data.recent) { const value = byEngine.get(item.engine) || { requests: 0, verified: 0, errors: 0 }; value.last = item.last_crawl; byEngine.set(item.engine, value); }
  $('#crawler-summary').innerHTML = byEngine.size ? [...byEngine].map(([name, value]) => `<article class="crawler-card"><h3>${escapeHtml(name || '其他搜尋引擎')}</h3><p>爬取 ${value.requests.toLocaleString()} 次 · 已驗證 ${value.verified.toLocaleString()}</p><p>4xx/5xx ${value.errors.toLocaleString()} · 最近 ${escapeHtml(prettyTime(value.last))}</p></article>`).join('') : '<p class="muted">此區間沒有搜尋引擎爬取紀錄。</p>';
  $('#crawler-daily').innerHTML = data.daily.length ? data.daily.map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${escapeHtml(row.engine || '其他搜尋引擎')}</td><td>${Number(row.requests)}</td><td>${Number(row.verified)}</td><td>${Number(row.errors)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">尚無每日爬取紀錄</td></tr>';
  $('#crawler-pages').innerHTML = data.pages.length ? data.pages.map((row) => `<tr><td>${escapeHtml(row.engine || '其他搜尋引擎')}</td><td><code>${escapeHtml(row.path)}</code></td><td>${Number(row.requests)}</td><td>${Number(row.not_found)}</td><td>${Number(row.server_errors)}</td><td>${escapeHtml(prettyTime(row.last_seen))}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-row">尚無頁面爬取紀錄</td></tr>';
}
async function refresh() {
  $('#analytics-error').textContent = '';
  try {
    const query = rangeQuery();
    const [overview, trend, visitors, requests, crawlers, events, diagnostics] = await Promise.all([
      request(`/api/analytics/overview?${query}`), request(`/api/analytics/trend?${query}`), request(visitorUrl()), request(`/api/analytics/requests?${requestQuery()}`), request(`/api/analytics/crawlers?${query}`), request(`/api/analytics/events?${query}`), request('/api/analytics/diagnostics')
    ]);
    renderMetrics(overview); renderTrend(trend); renderVisitors(visitors); renderRequests(requests); renderCrawlers(crawlers);
    $('#events-summary').innerHTML = events.length ? events.map((row) => `<tr><td>${escapeHtml(eventLabel(row.event_name))}</td><td>${Number(row.count)}</td><td>${Number(row.sessions)}</td></tr>`).join('') : '<tr><td colspan="3">此區間尚無互動事件</td></tr>';
    $('#ip-diagnostics').textContent = `本次連線來源：${diagnostics.source} · IP：${diagnostics.resolved || '無法確認'} · 代理：${diagnostics.socketPeer || '無'} · X-Real-IP：${diagnostics.xRealIp || '無'} · CF：${diagnostics.cfConnectingIp || '無'} · XFF：${diagnostics.forwardedFor.filter(Boolean).join(' → ') || '無'}（僅供診斷，不採信 XFF）`;

  } catch (error) { $('#analytics-error').textContent = `無法載入流量分析：${error.message}`; }
}
$('#visitor-search').addEventListener('input', () => { clearTimeout(state.visitorTimer); state.visitorTimer = setTimeout(async () => { state.visitorPage = 1; try { renderVisitors(await request(visitorUrl())); } catch (error) { $('#analytics-error').textContent = error.message; } }, 250); });
$('#visitors-prev').addEventListener('click', async () => { state.visitorPage = Math.max(1, state.visitorPage - 1); try { renderVisitors(await request(visitorUrl())); } catch (error) { $('#analytics-error').textContent = error.message; } });
$('#visitors-next').addEventListener('click', async () => { state.visitorPage++; try { renderVisitors(await request(visitorUrl())); } catch (error) { state.visitorPage--; $('#analytics-error').textContent = error.message; } });
document.querySelectorAll('[data-device]').forEach((button) => button.addEventListener('click', () => { state.visitorDevice = button.dataset.device; document.querySelectorAll('[data-device]').forEach((node) => node.classList.toggle('is-active', node === button)); renderVisitors(state.visitorRows); }));
document.querySelector('[data-device=""]').classList.add('is-active');
document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => { const field = button.dataset.sort; state.visitorDirection = state.visitorSort === field ? -state.visitorDirection : 1; state.visitorSort = field; document.querySelectorAll('[data-sort]').forEach((node) => node.setAttribute('aria-sort', node === button ? (state.visitorDirection === 1 ? 'ascending' : 'descending') : 'none')); renderVisitors(state.visitorRows); }));
['request-ip', 'request-path', 'request-status', 'request-from-time', 'request-to-time'].forEach((id) => $(`#${id}`).addEventListener(id.includes('time') ? 'change' : 'input', () => { clearTimeout(state.requestTimer); state.requestTimer = setTimeout(() => { state.requestPage = 1; request(requestUrl()).then((rows) => renderRequests(rows)).catch((error) => { $('#analytics-error').textContent = error.message; }); }, 250); }));
function requestUrl() { return `/api/analytics/requests?${requestQuery()}`; }
document.querySelectorAll('[data-bot]').forEach((button) => button.addEventListener('click', () => { state.bot = button.dataset.bot; if (!state.bot) state.engine = ''; document.querySelectorAll('[data-bot]').forEach((node) => node.classList.toggle('is-active', node === button)); state.requestPage = 1; request(requestUrl()).then((rows) => renderRequests(rows)).catch((error) => { $('#analytics-error').textContent = error.message; }); }));
document.querySelectorAll('[data-engine]').forEach((button) => button.addEventListener('click', () => { state.engine = button.dataset.engine; state.bot = 'search_engine'; document.querySelectorAll('[data-bot],[data-engine]').forEach((node) => node.classList.toggle('is-active', node === button)); state.requestPage = 1; request(requestUrl()).then((rows) => renderRequests(rows)).catch((error) => { $('#analytics-error').textContent = error.message; }); }));
$('#requests-more').addEventListener('click', async () => { state.requestPage++; try { renderRequests(await request(requestUrl()), true); } catch (error) { $('#analytics-error').textContent = error.message; } });
$('#show-full-ip').addEventListener('change', async () => { try { const [visitors, requests] = await Promise.all([request(visitorUrl()), request(requestUrl())]); renderVisitors(visitors); renderRequests(requests); } catch (error) { $('#analytics-error').textContent = error.message; } });
$('#visitors-body').addEventListener('click', async (event) => { const button = event.target.closest('[data-session]'); if (!button) return; try { const data = await request(`/api/analytics/sessions/${encodeURIComponent(button.dataset.session)}`); $('#path-summary').textContent = `工作階段：${prettyTime(data.started_at)} · 裝置：${data.device} · 來源：${data.referrer || '直接進站'}`; const entries = data.pages.map((page) => ({ at: page.entered_at, text: page.page_path, detail: `停留約 ${duration(page.duration_seconds)}${page.previous_path ? ` · 從 ${page.previous_path} 前往` : ' · 進站頁面'}` })); for (const item of data.events) entries.push({ at: item.occurred_at, text: `事件：${eventLabel(item.event_name)}`, detail: item.target || '' }); entries.sort((a, b) => a.at.localeCompare(b.at)); if (entries.length) entries.push({ at: data.last_seen, text: '離開或切換至未記錄頁面', detail: '之後沒有收到此工作階段的頁面瀏覽紀錄。' }); $('#journey-list').innerHTML = entries.length ? entries.map((entry) => `<li><strong>${escapeHtml(entry.text)}</strong><small>${escapeHtml(prettyTime(entry.at))} · ${escapeHtml(entry.detail)}</small></li>`).join('') : '<li>此工作階段尚無瀏覽事件。</li>'; pathDialog.showModal(); } catch (error) { $('#analytics-error').textContent = error.message; } });
$('#close-path').addEventListener('click', () => pathDialog.close());
document.querySelectorAll('[data-bot=""]').forEach((button) => button.classList.add('is-active'));
checkSession();
