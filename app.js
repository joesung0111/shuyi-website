(() => {
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
    const renderContent = (filter = 'all') => { const items = window.SHU_YI_CONTENT.filter((item) => filter === 'all' || item.type === filter); grid.innerHTML = items.map((item) => `<article class="content-card content-card--${item.accent}"><div class="card-art">${item.type === 'video' ? `<button class="card-play" data-video="${item.video}" aria-label="播放 ${item.title}">▶</button>` : `<span>${item.type.toUpperCase()}</span>`}</div><div class="card-meta"><span>${item.tag}</span><span>${item.date}</span></div><h3>${item.title}</h3><p>${item.excerpt}</p><a href="${item.href}">閱讀內容 <span>→</span></a></article>`).join(''); };
    renderContent();
    document.addEventListener('shuyi-content-ready', () => renderContent());
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-selected', 'false'); }); button.classList.add('is-active'); button.setAttribute('aria-selected', 'true'); renderContent(button.dataset.filter); }));
  }
  const videoDialog = document.querySelector('#video-dialog'); const dialogVideo = document.querySelector('#dialog-video');
  if (videoDialog && dialogVideo) { document.addEventListener('click', (event) => { const play = event.target.closest('[data-video]'); if (!play) return; event.preventDefault(); dialogVideo.src = play.dataset.video; videoDialog.showModal(); dialogVideo.play(); }); videoDialog.querySelector('.dialog-close').addEventListener('click', () => { dialogVideo.pause(); videoDialog.close(); }); }
})();
