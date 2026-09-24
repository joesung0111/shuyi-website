(() => {
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const root = document.documentElement;
  const switcher = document.querySelector('.theme-switch');
  if (switcher) {
    const label = switcher.querySelector('.theme-switch__label');
    const setTheme = (theme) => { root.dataset.theme = theme; localStorage.setItem('shuyi-theme', theme); switcher.setAttribute('aria-pressed', String(theme === 'dark')); label.textContent = theme === 'dark' ? 'DARK' : 'LIGHT'; };
    setTheme(localStorage.getItem('shuyi-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
    switcher.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));
  }
  const menuButton = document.querySelector('.menu-button');
  if (menuButton) menuButton.addEventListener('click', () => { const open = document.body.classList.toggle('menu-open'); menuButton.setAttribute('aria-expanded', String(open)); });
  document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => document.body.classList.remove('menu-open')));
  const grid = document.querySelector('#content-grid');
  if (grid && window.SHU_YI_CONTENT) {
    const renderContent = (filter = 'all') => { const items = window.SHU_YI_CONTENT.filter((item) => filter === 'all' || item.type === filter); grid.innerHTML = items.map((item) => { const title = escapeHtml(item.title); const cover = item.cover ? `<img class="card-cover" src="${escapeHtml(item.cover)}" alt="${title}">` : ''; const visual = cover || (item.type === 'video' ? `<button class="card-play" data-video="${escapeHtml(item.video)}" aria-label="播放 ${title}">▶</button>` : `<span>${escapeHtml(item.type).toUpperCase()}</span>`); return `<article class="content-card content-card--${escapeHtml(item.accent)}"><div class="card-art">${visual}</div><div class="card-meta"><span>${escapeHtml(item.tag)}</span><span>${escapeHtml(item.date)}</span></div><h3>${title}</h3><p>${escapeHtml(item.excerpt)}</p><a href="${escapeHtml(item.href)}">閱讀內容 <span>→</span></a></article>`; }).join(''); };
    renderContent();
    document.addEventListener('shuyi-content-ready', () => renderContent());
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-selected', 'false'); }); button.classList.add('is-active'); button.setAttribute('aria-selected', 'true'); renderContent(button.dataset.filter); }));
  }
  const videoDialog = document.querySelector('#video-dialog'); const dialogVideo = document.querySelector('#dialog-video');
  if (videoDialog && dialogVideo) { document.addEventListener('click', (event) => { const play = event.target.closest('[data-video]'); if (!play) return; event.preventDefault(); dialogVideo.src = play.dataset.video; videoDialog.showModal(); dialogVideo.play(); }); videoDialog.querySelector('.dialog-close').addEventListener('click', () => { dialogVideo.pause(); videoDialog.close(); }); }
})();
