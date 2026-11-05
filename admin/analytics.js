const $ = (selector) => document.querySelector(selector);
const tokenKey = 'shuyi_admin_token';
const state = { bot: '', engine: '', kind: '', logIndex: 0, logCursors: [], logMeta: null, logBase: null, logBusy: false, logEpoch: 0, refreshEpoch: 0, trendRows: [], series: new Set(['visitors','pageviews','requests','admin_requests','crawlers']), requestTimer: 0, visitorTimer: 0, range: '', visitorRows: [], visitorPage: 1, visitorDevice: '', visitorSort: 'last_seen', visitorDirection: -1 };
const loginView = $('#login-view'); const appView = $('#app-view'); const pathDialog = $('#path-dialog');
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const prettyTime = (value) => value ? new Date(value).toLocaleString('zh-TW', { hour12: false }) : '—';
const eventLabel = (name) => ({ booking_cta_click: '預約按鈕', booking_platform_outbound: '開啟預約平台', line_click: 'LINE 連結', video_play: '影片播放', video_complete: '影片看完', video_open: '開啟外部影片', booking_submit_success: '預約成功（平台回報）', form_submit_success: '表單成功送出', journal_to_service: '文章前往服務頁', journal_to_booking: '文章前往預約頁' }[name] || name);
const duration = (seconds) => { const n = Math.max(0, Number(seconds) || 0); return n < 60 ? `${n} 秒` : `${Math.floor(n / 60)} 分 ${Math.round(n % 60)} 秒`; };
const ipMask = (ip) => { if (!ip) return '—'; if (ip.includes(':')) { const [left, right = ''] = ip.toLowerCase().split('::'); const a = left ? left.split(':') : []; const b = right ? right.split(':') : []; const groups = ip.includes('::') ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill('0'), ...b] : ip.split(':'); const first = groups.slice(0, 4); return first.every((part) => !parseInt(part || '0', 16)) ? '::' : `${first.join(':')}::`; } const p = ip.split('.'); return p.length === 4 ? `${p[0]}.${p[1]}.${p[2]}.0` : '—'; };
const ipSourceLabel = (source) => ({ socket: '直接連線', 'railway-x-real-ip': 'Railway', cloudflare: 'Cloudflare', 'unresolved-proxy': '代理來源待確認', legacy: '舊紀錄' }[source] || '未知');
const displayIp = (ip) => $('#show-full-ip')?.checked ? (ip || '—') : ipMask(ip);
const SERIES = [['visitors', '一般訪客'], ['pageviews', '頁面瀏覽'], ['requests', '總請求'], ['admin_requests', '管理者請求'], ['crawlers', '搜尋爬蟲']];
const EVENT_HELP = { booking_cta_click: '點擊前往預約的按鈕', booking_platform_outbound: '離開官網前往預約平台', line_click: '點擊 LINE 官方帳號連結', video_play: 'HTML5 影片實際開始播放（排除裝飾自動播放）', video_complete: 'HTML5 影片播放至結尾', video_open: '開啟外部影片播放器，未確認是否播放', form_submit_success: '收到表單成功回報', booking_submit_success: '收到預約成功回報，非交易驗證', journal_to_service: '從文章前往服務頁', journal_to_booking: '從文章前往預約頁' };
let refreshController, logController, visitorController, exportController, eventController;
let diagnosticsLoaded = false;
function errorText(error) { return error.name === 'AbortError' ? '' : error.message; }
async function request(url, options = {}) {
  const token = sessionStorage.getItem(tokenKey);
  const response = await fetch(url, { ...options, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }, credentials: 'same-origin', cache: 'no-store' });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) { if (response.status === 401) showLogin(); throw new Error(result.error || '查詢失敗'); }
  return result;
}
function showLogin() {
  clearTimeout(state.requestTimer); clearTimeout(state.visitorTimer); ++state.logEpoch; ++state.refreshEpoch;
  [refreshController, logController, visitorController, exportController, eventController].forEach((controller) => controller?.abort());
  loginView.hidden = false; loginView.style.display = 'grid'; appView.hidden = true; appView.style.display = 'none';
  $('#show-full-ip').checked = false; state.visitorRows = []; state.logMeta = null;
  ['visitors-body','requests-body','metrics','events-summary','event-detail-body','journey-list','trend-chart'].forEach((id) => $(`#${id}`).replaceChildren());
  [pathDialog, $('#event-dialog')].forEach((dialog) => { if (dialog.open) dialog.close(); });
  $('#diagnostics-details').open = false;
  hideTrend();
}
function showApp() { loginView.hidden = true; loginView.style.display = 'none'; appView.hidden = false; appView.style.display = 'block'; refresh(); }
async function checkSession() { try { await request('/api/admin/session'); showApp(); } catch { showLogin(); } }
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault(); $('#login-error').textContent = ''; const button = event.currentTarget.querySelector('button'); button.disabled = true;
  try { const result = await request('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: new FormData(event.currentTarget).get('password') }) }); sessionStorage.setItem(tokenKey, result.token); event.target.reset(); showApp(); }
  catch (error) { $('#login-error').textContent = errorText(error); } finally { button.disabled = false; }
});
$('#logout-button').addEventListener('click', async () => { try { await request('/api/admin/logout', { method: 'POST' }); } finally { sessionStorage.removeItem(tokenKey); diagnosticsLoaded = false; showLogin(); } });
function rangeQuery() { return new URLSearchParams({ from: $('#date-from').value, to: $('#date-to').value, fullIp: $('#show-full-ip').checked ? '1' : '0', tzOffset: String(new Date().getTimezoneOffset()) }); }
function visitorUrl() { const query = rangeQuery(); query.set('page', state.visitorPage); query.set('limit', 50); if ($('#visitor-search').value.trim()) query.set('q', $('#visitor-search').value.trim()); return `/api/analytics/visitors?${query}`; }
function setRange(kind) {
  const from = new Date(), to = new Date();
  if (kind === 'yesterday') { from.setDate(from.getDate() - 1); to.setDate(to.getDate() - 1); }
  else if (kind === '7') from.setDate(from.getDate() - 6);
  else if (kind === '30') from.setDate(from.getDate() - 29);
  $('#date-from').value = localDate(from); $('#date-to').value = localDate(to); state.range = kind;
  $('#request-from-time').value = ''; $('#request-to-time').value = ''; state.visitorPage = 1;
  document.querySelectorAll('[data-range]').forEach((button) => button.classList.toggle('is-active', button.dataset.range === kind));
}
document.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => { setRange(button.dataset.range); refresh(); }));
$('#apply-range').addEventListener('click', () => { state.range = ''; state.visitorPage = 1; $('#request-from-time').value = ''; $('#request-to-time').value = ''; document.querySelectorAll('[data-range]').forEach((button) => button.classList.remove('is-active')); refresh(); });
setRange('today');
function renderMetrics(data) {
  const cards = [['不重複訪客', data.visitors], ['總請求', data.requests], ['頁面瀏覽', data.pageviews], ['工作階段', data.sessions], ['平均停留', duration(data.avg_duration)], ['搜尋爬蟲', data.crawlers], ['其他 Bot', data.other_bots], ['HTTP 錯誤（4xx/5xx）', data.errors], ['管理者請求', data.admin_requests]];
  $('#metrics').innerHTML = cards.map(([label, value]) => `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(typeof value === 'string' ? value : (Number(value) || 0).toLocaleString('zh-TW'))}</strong></article>`).join('');
}
function bucketLabel(bucket) { return bucket.includes('T') ? `${bucket.slice(0, 10)} ${bucket.slice(11)}～${bucket.slice(11, 13)}:59` : bucket; }
function renderTrend(rows) {
  hideTrend(); state.trendRows = rows; const chart = $('#trend-chart');
  if (!rows.length) { chart.innerHTML = '<p class="empty-row">此區間尚無紀錄</p>'; return; }
  const max = Math.max(1, ...rows.flatMap((row) => SERIES.filter(([key]) => state.series.has(key)).map(([key]) => Number(row[key]) || 0)));
  chart.innerHTML = rows.map((row, index) => {
    const label = row.bucket.includes('T') ? row.bucket.slice(11, 16) : row.bucket.slice(5);
    const description = `${bucketLabel(row.bucket)}；${SERIES.map(([key, title]) => `${title} ${Number(row[key]) || 0}`).join('；')}`;
    return `<button type="button" class="trend-group" data-bucket="${index}" tabindex="${index ? -1 : 0}" aria-label="${escapeHtml(description)}" aria-describedby="trend-tooltip"><span class="trend-label">${escapeHtml(label)}</span>${SERIES.map(([key]) => `<i class="trend-bar" data-series="${key}" aria-hidden="true" ${state.series.has(key) ? '' : 'hidden'} style="height:${Math.max(Number(row[key]) ? 2 : 0, (Number(row[key]) || 0) / max * 100)}%"></i>`).join('')}</button>`;
  }).join('');
  const offset = -new Date().getTimezoneOffset();
  $('#trend-timezone').textContent = `時區：UTC${offset >= 0 ? '+' : '−'}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')} · 短區間每小時，較長區間每日；所有提示使用本次已載入的數據。`;
}
function hideTrend() { $('#trend-tooltip').hidden = true; }
function showTrend(group, series, point) {
  const row = state.trendRows[Number(group.dataset.bucket)]; if (!row) return;
  const tooltip = $('#trend-tooltip');
  tooltip.innerHTML = `<strong>${escapeHtml(bucketLabel(row.bucket))}</strong>${SERIES.map(([key, label]) => `<div class="tooltip-row ${series === key ? 'is-highlight' : ''}" data-series="${key}"><span>${escapeHtml(label)}</span><b>${(Number(row[key]) || 0).toLocaleString('zh-TW')}</b></div>`).join('')}<small>總請求已包含管理者與搜尋爬蟲。</small>`;
  tooltip.hidden = false; const rect = group.getBoundingClientRect();
  const x = point?.clientX ?? (rect.left + rect.width / 2), y = point?.clientY ?? rect.top;
  tooltip.style.left = `${Math.max(8, Math.min(innerWidth - tooltip.offsetWidth - 8, x + 12))}px`;
  const above = y - tooltip.offsetHeight - 12;
  tooltip.style.top = `${Math.max(8, Math.min(innerHeight - tooltip.offsetHeight - 8, above >= 8 ? above : y + 12))}px`;
}
const trendChart = $('#trend-chart');
trendChart.addEventListener('pointerover', (event) => { const group = event.target.closest('[data-bucket]'); if (group) showTrend(group, event.target.dataset.series, event); });
trendChart.addEventListener('pointerleave', () => { if (!trendChart.contains(document.activeElement)) hideTrend(); });
trendChart.addEventListener('focusin', (event) => { const group = event.target.closest('[data-bucket]'); if (group) showTrend(group); });
trendChart.addEventListener('focusout', (event) => { if (!trendChart.contains(event.relatedTarget)) hideTrend(); });
trendChart.addEventListener('click', (event) => { const group = event.target.closest('[data-bucket]'); if (group) showTrend(group, event.target.dataset.series); });
trendChart.addEventListener('keydown', (event) => {
  const buttons = [...trendChart.querySelectorAll('[data-bucket]')]; const index = buttons.indexOf(event.target);
  let next = index;
  if (event.key === 'ArrowRight') next = Math.min(buttons.length - 1, index + 1);
  else if (event.key === 'ArrowLeft') next = Math.max(0, index - 1);
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = buttons.length - 1;
  else return;
  event.preventDefault(); buttons.forEach((button, i) => button.tabIndex = i === next ? 0 : -1); buttons[next]?.focus();
});
trendChart.addEventListener('scroll', () => { const group = document.activeElement.closest?.('[data-bucket]'); if (group) showTrend(group); else hideTrend(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideTrend(); });
document.addEventListener('click', (event) => { if (!event.target.closest('#trend-chart')) hideTrend(); });
addEventListener('resize', hideTrend);
document.querySelectorAll('.chart-legend [data-series]').forEach((button) => button.addEventListener('click', () => {
  const key = button.dataset.series; if (state.series.has(key) && state.series.size === 1) return;
  if (state.series.has(key)) state.series.delete(key); else state.series.add(key);
  button.setAttribute('aria-pressed', String(state.series.has(key))); renderTrend(state.trendRows);
}));
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
function renderCrawlers(data) {
  const byEngine = new Map();
  for (const row of data.daily) { const item = byEngine.get(row.engine) || { requests: 0, verified: 0, errors: 0 }; item.requests += Number(row.requests) || 0; item.verified += Number(row.verified) || 0; item.errors += Number(row.errors) || 0; byEngine.set(row.engine, item); }
  for (const item of data.recent) { const value = byEngine.get(item.engine) || { requests: 0, verified: 0, errors: 0 }; value.last = item.last_crawl; byEngine.set(item.engine, value); }
  $('#crawler-summary').innerHTML = byEngine.size ? [...byEngine].map(([name, value]) => `<article class="crawler-card"><h3>${escapeHtml(name || '其他搜尋引擎')}</h3><p>爬取 ${value.requests.toLocaleString()} 次 · 已驗證 ${value.verified.toLocaleString()}</p><p>4xx/5xx ${value.errors.toLocaleString()} · 最近 ${escapeHtml(prettyTime(value.last))}</p></article>`).join('') : '<p class="muted">此區間沒有搜尋引擎爬取紀錄。</p>';
  $('#crawler-daily').innerHTML = data.daily.length ? data.daily.map((row) => `<tr><td>${escapeHtml(row.day)}</td><td>${escapeHtml(row.engine || '其他搜尋引擎')}</td><td>${Number(row.requests)}</td><td>${Number(row.verified)}</td><td>${Number(row.errors)}</td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">尚無每日爬取紀錄</td></tr>';
  $('#crawler-pages').innerHTML = data.pages.length ? data.pages.map((row) => `<tr><td>${escapeHtml(row.engine || '其他搜尋引擎')}</td><td><code>${escapeHtml(row.path)}</code></td><td>${Number(row.requests)}</td><td>${Number(row.not_found)}</td><td>${Number(row.server_errors)}</td><td>${escapeHtml(prettyTime(row.last_seen))}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-row">尚無頁面爬取紀錄</td></tr>';
}

function requestQuery() {
  const query = rangeQuery(); query.set('limit', 50);
  for (const [id, key] of [['request-from-time','fromTime'], ['request-to-time','toTime'], ['request-ip','ip'], ['request-path','path'], ['request-status','status']]) if ($(`#${id}`).value.trim()) query.set(key, $(`#${id}`).value.trim());
  if (state.bot) query.set('bot', state.bot); if (state.engine) query.set('engine', state.engine); if (state.kind) query.set('kind', state.kind);
  return query;
}
function logButtons() {
  $('#requests-body').closest('table').setAttribute('aria-busy', String(state.logBusy));
  $('#requests-prev').disabled = state.logBusy || !state.logMeta || state.logIndex <= 0;
  $('#requests-more').disabled = state.logBusy || !state.logMeta?.nextCursor;
  $('#requests-export').disabled = state.logBusy || !state.logMeta || state.logMeta.total === 0 || Boolean(exportController);
  $('#requests-refresh').disabled = state.logBusy;
}
function renderRequests(data) {
  const rows = data.rows; state.logMeta = data;
  $('#requests-body').innerHTML = rows.length ? rows.map((row) => `<tr><td>${escapeHtml(prettyTime(row.occurred_at))}</td><td title="${escapeHtml(ipSourceLabel(row.ip_source))}"><code>${escapeHtml(row.ip_source === 'legacy' && row.ip?.startsWith('100.64.') ? '代理 IP（舊紀錄）' : displayIp(row.ip))}</code></td><td>${escapeHtml(row.method)}</td><td><code>${escapeHtml(row.path)}</code></td><td class="status-code ${row.status >= 400 ? 'error' : ''}">${Number(row.status)}</td><td title="${escapeHtml(row.user_agent)}">${escapeHtml(row.user_agent.slice(0,96))}</td><td>${escapeHtml(row.referer || '—')}</td><td>${escapeHtml(categoryLabel(row))}</td></tr>`).join('') : '<tr><td colspan="8" class="empty-row">此區間尚無符合條件的紀錄</td></tr>';
  const first = rows.length ? data.offset + 1 : 0, last = rows.length ? data.offset + rows.length : 0;
  $('#request-count').textContent = `符合條件共 ${data.total.toLocaleString('zh-TW')} 筆 · 顯示 ${first.toLocaleString('zh-TW')}–${last.toLocaleString('zh-TW')} 筆 · 快照 ${prettyTime(data.snapshotAt)}`;
  $('#request-ip-heading').textContent = $('#show-full-ip').checked ? 'IP（完整）' : 'IP（遮罩）';
}
async function loadRequests(reset = false, index = state.logIndex) {
  clearTimeout(state.requestTimer); logController?.abort(); logController = new AbortController(); const epoch = ++state.logEpoch;
  if (reset) { state.logIndex = 0; index = 0; state.logCursors = []; state.logMeta = null; state.logBase = requestQuery(); $('#requests-body').replaceChildren(); }
  const query = new URLSearchParams(state.logBase || requestQuery());
  if (state.logCursors[index]) query.set('cursor', state.logCursors[index]);
  state.logBusy = true; $('#log-error').textContent = ''; logButtons();
  try {
    const data = await request(`/api/analytics/requests/page?${query}`, { signal: logController.signal });
    if (epoch !== state.logEpoch) return;
    state.logIndex = index; state.logCursors[0] = data.startCursor;
    if (data.nextCursor) state.logCursors[index + 1] = data.nextCursor;
    renderRequests(data);
  } catch (error) { if (epoch === state.logEpoch && error.name !== 'AbortError') { $('#log-error').textContent = error.message; state.logMeta = null; $('#request-count').textContent = '未能載入；請調整條件或重新查詢。'; } }
  finally { if (epoch === state.logEpoch) { state.logBusy = false; logButtons(); } }
}
function scheduleLogs() {
  clearTimeout(state.requestTimer); logController?.abort(); ++state.logEpoch; state.logMeta = null; state.logBusy = true; logButtons();
  state.requestTimer = setTimeout(() => loadRequests(true), 600);
}
async function loadVisitors() {
  visitorController?.abort(); visitorController = new AbortController();
  try { renderVisitors(await request(visitorUrl(), { signal: visitorController.signal })); } catch (error) { if (error.name !== 'AbortError') $('#analytics-error').textContent = error.message; }
}
function renderEvents(events) {
  $('#events-summary').innerHTML = events.length ? events.map((row) => `<tr><td>${escapeHtml(eventLabel(row.event_name))}</td><td>${escapeHtml(EVENT_HELP[row.event_name] || '網站回報的互動行為')}</td><td>${Number(row.count).toLocaleString('zh-TW')}</td><td>${Number(row.sessions).toLocaleString('zh-TW')}</td><td><button type="button" class="journey-button" data-event="${escapeHtml(row.event_name)}">查看來源與明細</button></td></tr>`).join('') : '<tr><td colspan="5" class="empty-row">此區間尚未收到一般訪客互動事件。</td></tr>';
}
async function refresh() {
  clearTimeout(state.visitorTimer); refreshController?.abort(); refreshController = new AbortController(); const epoch = ++state.refreshEpoch;
  $('#analytics-error').textContent = ''; hideTrend(); state.trendRows = []; $('#metrics').replaceChildren(); $('#trend-chart').innerHTML = '<p class="empty-row">正在查詢…</p>'; $('#events-summary').replaceChildren(); eventController?.abort(); if ($('#event-dialog').open) $('#event-dialog').close();
  const query = rangeQuery(); query.delete('fullIp');
  const summary = request(`/api/analytics/dashboard?${query}`, { signal: refreshController.signal }).then((data) => {
    if (epoch !== state.refreshEpoch) return;
    renderMetrics(data.overview); renderTrend(data.trend); renderCrawlers(data.crawlers); renderEvents(data.events);
    $('#log-policy').textContent = `設定保存 ${data.limits.retentionDays} 天；單次請求查詢最多 ${data.limits.rangeDays} 天，每頁 50 筆。CSV 每次最多 ${data.limits.exportRows.toLocaleString('zh-TW')} 筆／10 MB，固定遮罩 IP。快照有效 ${data.limits.snapshotMinutes} 分鐘；新請求請按「重新查詢」。摘要更新：${prettyTime(data.generatedAt)}。`;
  }).catch((error) => { if (epoch === state.refreshEpoch && error.name !== 'AbortError') { $('#analytics-error').textContent = error.message; $('#trend-chart').innerHTML = '<p class="empty-row">無法查詢，請檢查日期條件。</p>'; } });
  await Promise.allSettled([summary, loadVisitors(), loadRequests(true)]);
}
$('#diagnostics-details').addEventListener('toggle', async (event) => {
  if (!event.currentTarget.open || diagnosticsLoaded) return;
  diagnosticsLoaded = true;
  try { const data = await request('/api/analytics/diagnostics'); $('#ip-diagnostics').textContent = `來源：${data.source} · IP：${data.resolved || '無法確認'} · 代理：${data.socketPeer || '無'} · X-Real-IP：${data.xRealIp || '無'} · CF：${data.cfConnectingIp || '無'} · XFF：${data.forwardedFor.filter(Boolean).join(' → ') || '無'}（僅供診斷）`; }
  catch (error) { diagnosticsLoaded = false; $('#ip-diagnostics').textContent = errorText(error); }
});
$('#visitor-search').addEventListener('input', () => { clearTimeout(state.visitorTimer); visitorController?.abort(); state.visitorTimer = setTimeout(() => { state.visitorPage = 1; loadVisitors(); }, 600); });
$('#visitors-prev').addEventListener('click', () => { state.visitorPage = Math.max(1,state.visitorPage-1); loadVisitors(); });
$('#visitors-next').addEventListener('click', () => { state.visitorPage++; loadVisitors(); });
document.querySelectorAll('[data-device]').forEach((button) => button.addEventListener('click', () => { state.visitorDevice = button.dataset.device; document.querySelectorAll('[data-device]').forEach((node) => node.classList.toggle('is-active',node===button)); renderVisitors(state.visitorRows); }));
document.querySelector('[data-device=""]').classList.add('is-active');
document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => { const field=button.dataset.sort; state.visitorDirection=state.visitorSort===field?-state.visitorDirection:1; state.visitorSort=field; renderVisitors(state.visitorRows); }));
['request-ip','request-path','request-status','request-from-time','request-to-time'].forEach((id) => $(`#${id}`).addEventListener(id.includes('time')?'change':'input',scheduleLogs));
document.querySelectorAll('[data-bot],[data-engine]').forEach((button) => button.addEventListener('click', () => {
  state.engine=button.dataset.engine||''; state.bot=state.engine?'search_engine':button.dataset.bot;
  document.querySelectorAll('[data-bot],[data-engine]').forEach((node) => node.classList.toggle('is-active',node===button)); loadRequests(true);
}));
document.querySelectorAll('[data-kind]').forEach((button) => button.addEventListener('click', () => { state.kind=button.dataset.kind; document.querySelectorAll('[data-kind]').forEach((node) => node.classList.toggle('is-active',node===button)); loadRequests(true); }));
$('#requests-prev').addEventListener('click', () => loadRequests(false,state.logIndex-1));
$('#requests-more').addEventListener('click', () => loadRequests(false,state.logIndex+1));
$('#requests-refresh').addEventListener('click', () => loadRequests(true));
$('#show-full-ip').addEventListener('change', () => { loadVisitors(); loadRequests(true); });
$('#requests-export').addEventListener('click', async () => {
  if (!state.logMeta || exportController) return;
  const query=new URLSearchParams(state.logBase); query.set('cursor',state.logMeta.startCursor); query.set('fullIp','0');
  exportController=new AbortController(); logButtons(); const status=$('#export-status'); status.textContent='正在匯出本次查詢快照；請勿關閉頁面。';
  try {
    const response=await fetch(`/api/analytics/requests/export?${query}`,{headers:{authorization:`Bearer ${sessionStorage.getItem(tokenKey)||''}`},credentials:'same-origin',cache:'no-store',signal:exportController.signal});
    if (!response.ok) { if(response.status===401) showLogin(); const data=await response.json(); throw new Error(data.error||'匯出失敗'); }
    const reader=response.body.getReader(), chunks=[]; let size=0;
    while(true){const item=await reader.read();if(item.done)break;size+=item.value.byteLength;if(size>10*1024*1024){await reader.cancel();throw new Error('檔案超過 10 MB，已取消下載，請縮小範圍。');}chunks.push(item.value);}
    const blob=new Blob(chunks,{type:'text/csv;charset=utf-8'}), url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`shuyi-requests-masked-${localDate()}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent=`匯出完成：查詢快照共 ${response.headers.get('x-export-row-count')||''} 筆，檔案約 ${(size/1024).toFixed(1)} KB；IP 已遮罩。保存期限清理可能減少實際筆數，請妥善保管檔案。`;
  } catch(error) { status.textContent=errorText(error)||'下載已取消。'; }
  finally { exportController=null;logButtons(); }
});
const eventDialog=$('#event-dialog');
$('#events-summary').addEventListener('click',async(event)=>{
  const button=event.target.closest('[data-event]');if(!button)return;
  eventController?.abort();eventController=new AbortController();const query=rangeQuery();query.delete('fullIp');query.set('event',button.dataset.event);
  $('#event-dialog-title').textContent=eventLabel(button.dataset.event);$('#event-detail-error').textContent='';$('#event-detail-body').textContent='正在載入…';eventDialog.showModal();
  try{const data=await request(`/api/analytics/events/details?${query}`,{signal:eventController.signal});
    $('#event-detail-body').innerHTML=`<p class="muted">最多列出前 20 個來源頁面與最近 25 筆活動；次數、工作階段以目前日期範圍統計，排除管理者。</p><h3>來源頁面</h3><div class="table-scroll"><table><thead><tr><th>頁面</th><th>次數</th><th>工作階段</th></tr></thead><tbody>${data.pages.map(row=>`<tr><td>${escapeHtml(row.page_path||'未記錄頁面')}</td><td>${Number(row.count)}</td><td>${Number(row.sessions)}</td></tr>`).join('')||'<tr><td colspan="3">沒有來源紀錄</td></tr>'}</tbody></table></div><h3>最近活動</h3><ol class="journey-list">${data.recent.map(row=>`<li><strong>${escapeHtml(row.page_path||'未記錄頁面')}</strong><small>${escapeHtml(prettyTime(row.occurred_at))} · ${escapeHtml(row.target||'')}</small><button class="journey-button" data-session="${escapeHtml(row.session_id)}">查看瀏覽路徑</button></li>`).join('')||'<li>沒有活動紀錄</li>'}</ol>`;
  }catch(error){if(error.name!=='AbortError'){$('#event-detail-error').textContent=error.message;$('#event-detail-body').replaceChildren();}}
});
$('#close-event').addEventListener('click',()=>eventDialog.close());eventDialog.addEventListener('close',()=>eventController?.abort());
async function openJourney(sessionId){
  if(eventDialog.open)eventDialog.close();
  try{const data=await request(`/api/analytics/sessions/${encodeURIComponent(sessionId)}`);$('#path-summary').textContent=`工作階段：${prettyTime(data.started_at)} · 裝置：${data.device} · 來源：${data.referrer||'直接進站'}`;
    const entries=data.pages.map(page=>({at:page.entered_at,text:page.page_path,detail:`停留約 ${duration(page.duration_seconds)}${page.previous_path?` · 從 ${page.previous_path} 前往`:' · 進站頁面'}`}));
    for(const item of data.events)entries.push({at:item.occurred_at,text:`事件：${eventLabel(item.event_name)}`,detail:item.target||''});entries.sort((a,b)=>a.at.localeCompare(b.at));
    if(entries.length)entries.push({at:data.last_seen,text:'之後沒有收到頁面紀錄',detail:'可能離開、閒置或切換至未追蹤頁面，無法確認真正離站時間。'});
    $('#journey-list').innerHTML=entries.map(entry=>`<li><strong>${escapeHtml(entry.text)}</strong><small>${escapeHtml(prettyTime(entry.at))} · ${escapeHtml(entry.detail)}</small></li>`).join('')||'<li>此工作階段尚無瀏覽事件。</li>';pathDialog.showModal();
  }catch(error){$('#analytics-error').textContent=errorText(error);}
}
[$('#visitors-body'),$('#event-detail-body')].forEach(node=>node.addEventListener('click',event=>{const button=event.target.closest('[data-session]');if(button)openJourney(button.dataset.session);}));
$('#close-path').addEventListener('click',()=>pathDialog.close());
document.querySelectorAll('[data-bot=""]').forEach(button=>button.classList.add('is-active'));
checkSession();
