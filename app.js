(() => {
  if (!document.querySelector('link[rel="icon"]')) { const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.type = 'image/jpeg'; favicon.href = '/素材/淺色系-1K.jpeg'; document.head.append(favicon); }
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
  const normalizePath = (path) => path.replace(/index\.html$/, '').replace(/\/+$/, '') || '/';
  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('.site-nav a').forEach((link) => { const isCurrent = normalizePath(new URL(link.href, window.location.href).pathname) === currentPath; link.classList.toggle('is-current', isCurrent); if (isCurrent) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); link.addEventListener('click', () => document.body.classList.remove('menu-open')); });
  document.querySelectorAll('.hero h1, .page-hero h1, .booking-card h1, .studio-page__copy h1').forEach((heading) => { heading.innerHTML = heading.innerHTML.replaceAll('。', ''); });
  const heroStamp = document.querySelector('.hero-stamp');
  if (heroStamp) { const words = ['MOVE', 'WELL', 'LIVE', 'LIGHT']; heroStamp.setAttribute('aria-label', words.join(' ')); heroStamp.innerHTML = words.map((word, index) => `<span style="--word-index:${index}">${word}</span>`).join(''); }
  const homeHero = document.querySelector('.hero');
  if (homeHero && !matchMedia('(prefers-reduced-motion: reduce)').matches) { const heroStage = homeHero.querySelector('.hero-stage'); homeHero.classList.add('home-intro'); if (heroStage) { const stageBounds = heroStage.getBoundingClientRect(); const heroBounds = homeHero.getBoundingClientRect(); const targetX = window.innerWidth / 2; const targetY = heroBounds.top + heroBounds.height / 2; heroStage.style.setProperty('--intro-x', `${targetX - (stageBounds.left + stageBounds.width / 2)}px`); heroStage.style.setProperty('--intro-y', `${targetY - (stageBounds.top + stageBounds.height / 2)}px`); heroStage.classList.add('hero-stage--intro'); window.setTimeout(() => heroStage.classList.remove('hero-stage--intro'), 3150); } homeHero.addEventListener('pointermove', (event) => { const bounds = homeHero.getBoundingClientRect(); homeHero.style.setProperty('--pointer-x', `${((event.clientX - bounds.left) / bounds.width * 100).toFixed(1)}%`); homeHero.style.setProperty('--pointer-y', `${((event.clientY - bounds.top) / bounds.height * 100).toFixed(1)}%`); }); homeHero.addEventListener('pointerleave', () => { homeHero.style.removeProperty('--pointer-x'); homeHero.style.removeProperty('--pointer-y'); }); const homeMotionTargets = [...document.querySelectorAll('.hero h1, .home-links .home-link, .motion-copy h2')]; homeMotionTargets.forEach((element, index) => { element.classList.add(index % 2 ? 'clip-reveal--right' : 'text-mask-reveal'); }); const revealHomeMotion = () => { homeMotionTargets.forEach((element) => { const bounds = element.getBoundingClientRect(); if (bounds.top < window.innerHeight * .92 && bounds.bottom > 0) element.classList.add('is-motion-visible'); }); if (heroStage) heroStage.style.setProperty('--hero-scroll-shift', `${Math.min(window.scrollY, 600) * -.075}px`); }; requestAnimationFrame(revealHomeMotion); window.addEventListener('scroll', revealHomeMotion, { passive:true }); }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) { const revealTargets = document.querySelectorAll('.section, .page-hero, .article, .booking-card, .studio-page__copy, .service-list article, .service-flow__step'); revealTargets.forEach((element, index) => { element.classList.add('reveal-on-scroll'); element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`); }); const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .12 }); revealTargets.forEach((element) => observer.observe(element)); }
  const serviceList = document.querySelector('.service-list');
  if (serviceList && !document.querySelector('[data-flow-progress]')) {
    serviceList.closest('section').insertAdjacentHTML('afterend', '<section class="service-flow section" data-flow-progress><div class="service-flow__intro"><p class="eyebrow">THE SHU YI WAY / 02</p><h2>從理解開始，<br><em>慢慢找回活動。</em></h2><p>每一次調理都從當下狀態出發，在過程裡感受身體，再把合適的照顧帶回日常。</p></div><div class="service-flow__track"><div class="service-flow__line" aria-hidden="true"><i></i></div><ol class="service-flow__steps"><li class="service-flow__step is-active"><span>01</span><div><h3>先理解狀態</h3><p>從今天的身體感受與日常活動開始，找到舒服的起點。</p></div></li><li class="service-flow__step"><span>02</span><div><h3>安排活化節奏</h3><p>依當下狀態安排調理，不套用每個人都一樣的固定流程。</p></div></li><li class="service-flow__step"><span>03</span><div><h3>留意身體變化</h3><p>在過程中保持感受，讓活動與舒適度成為調整的方向。</p></div></li><li class="service-flow__step"><span>04</span><div><h3>帶回日常裡</h3><p>留下能延續到生活中的身體照顧空間，慢慢找回自在。</p></div></li></ol></div></section>');
  }
  const serviceFlow = document.querySelector('[data-flow-progress]');
  if (serviceFlow) {
    const steps = [...serviceFlow.querySelectorAll('.service-flow__step')]; const progress = serviceFlow.querySelector('.service-flow__line i'); let progressFrame = 0;
    const updateFlow = () => { progressFrame = 0; const bounds = serviceFlow.getBoundingClientRect(); const travel = Math.max(bounds.height - window.innerHeight * .35, 1); const amount = Math.min(1, Math.max(0, (window.innerHeight * .32 - bounds.top) / travel)); if (progress) progress.style.transform = `scaleY(${amount})`; };
    window.addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateFlow); }, { passive: true }); window.addEventListener('resize', updateFlow, { passive: true }); updateFlow();
    if ('IntersectionObserver' in window) { const stepObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { steps.forEach((step) => step.classList.remove('is-active')); entry.target.classList.add('is-active'); } }), { rootMargin: '-35% 0px -45% 0px', threshold: 0 }); steps.forEach((step) => stepObserver.observe(step)); }
  }
  const bookingCard = document.querySelector('.booking-card');
  if (bookingCard && !bookingCard.querySelector('[data-booking-entry]')) {
    bookingCard.classList.add('booking-card--ready');
    const intro = bookingCard.querySelector('p:not(.eyebrow)');
    const notice = bookingCard.querySelector('.booking-notice');
    if (intro) intro.remove();
    if (notice) notice.remove();
    bookingCard.insertAdjacentHTML('beforeend', '<div class="booking-entry" data-booking-entry><div class="booking-browser" aria-label="掃描 QR Code 後開啟預約流程示意動畫"><div class="booking-browser__bar"><i></i><i></i><i></i><span>line.me → sy.up.railway.app</span></div><div class="booking-browser__body"><div class="booking-demo"><div class="booking-demo__scene"><div class="booking-demo__scan-target"><small>SCAN TO BOOK</small><img src="../素材/L_gainfriends_2dbarcodes_BW.png" alt=""></div><div class="booking-demo__phone" aria-hidden="true"><div class="booking-demo__phone-screen"><video class="booking-demo__video" muted playsinline><source src="../素材/預約流程影片.mp4" type="video/mp4"></video></div></div><span class="booking-demo__scan-line" aria-hidden="true"></span><span class="booking-demo__caption booking-demo__caption--scan">掃描 QR Code</span><span class="booking-demo__caption booking-demo__caption--login">LINE 登入</span><span class="booking-demo__caption booking-demo__caption--flow">進入預約流程</span></div><div class="booking-demo__status"><span></span><b>預約入口示意</b><em>QR → 登入 → 預約</em></div></div></div></div><div class="booking-entry__copy"><div class="booking-qr-card"><img src="../素材/L_gainfriends_2dbarcodes_BW.png" alt="掃描加入舒逸 LINE 官方帳號"><span>掃描加入 LINE@</span></div><p>加入 LINE@，可以先詢問服務內容；需要預約時，再前往舒逸預約平台選擇時間。</p><a class="button button--primary" href="https://sy.up.railway.app" target="_blank" rel="noopener">開啟預約平台 <span>↗</span></a></div></div>');
    const bookingSteps = bookingCard.querySelector('.booking-browser__bar span');
    if (bookingSteps) bookingSteps.className = 'booking-browser__steps';
    if (bookingSteps) bookingSteps.innerHTML = '<b class="booking-browser__step booking-browser__step--scan">01 / 掃 QR Code 或點連結</b><b class="booking-browser__step booking-browser__step--login">02 / 登入 LINE</b><b class="booking-browser__step booking-browser__step--time">03 / 選日期與時間</b><b class="booking-browser__step booking-browser__step--service">04 / 選服務項目</b><b class="booking-browser__step booking-browser__step--confirm">05 / 確認預約</b>';
    const bookingVideo = bookingCard.querySelector('.booking-demo__video');
    if (bookingVideo) bookingVideo.loop = false;
    const bookingStepItems = [...bookingCard.querySelectorAll('.booking-browser__step')];
    const bookingCycleMs = 29000;
    const bookingScanMs = 4500;
    const bookingLoginMs = 10500;
    const bookingTimeMs = 14500;
    const bookingServiceMs = 18000;
    const bookingVideoMaxTime = 19;
    const bookingVideoFadeStart = 18.5;
    let bookingVideoStopped = false;
    let bookingPreviousPhase = 0;
    const stopBookingVideoAtLimit = () => {
      if (bookingVideo && bookingVideo.currentTime >= bookingVideoFadeStart) {
        bookingVideo.classList.remove('is-active');
      }
      if (bookingVideo && bookingVideo.currentTime >= bookingVideoMaxTime) {
        bookingVideoStopped = true;
        bookingVideo.pause();
        bookingVideo.currentTime = bookingVideoMaxTime;
        bookingVideo.classList.remove('is-active');
      }
    };
    if (bookingVideo) {
      bookingVideo.addEventListener('timeupdate', stopBookingVideoAtLimit);
      bookingVideo.addEventListener('ended', () => {
        bookingVideoStopped = true;
        bookingVideo.classList.remove('is-active');
      });
    }
    const bookingCycleStarted = performance.now();
    const syncBookingDemo = () => {
      const phase = (performance.now() - bookingCycleStarted) % bookingCycleMs;
      if (phase < bookingPreviousPhase) bookingVideoStopped = false;
      bookingPreviousPhase = phase;
      const activeStep = phase < bookingScanMs ? 0 : phase < bookingLoginMs ? 1 : phase < bookingTimeMs ? 2 : phase < bookingServiceMs ? 3 : 4;
      bookingStepItems.forEach((step, index) => step.classList.toggle('is-active', index === activeStep));
      if (!bookingVideo) return;
      bookingVideo.classList.toggle('is-active', phase >= bookingScanMs && !bookingVideoStopped && bookingVideo.currentTime < bookingVideoFadeStart);
      if (phase < bookingScanMs) {
        if (!bookingVideo.paused) bookingVideo.pause();
        if (bookingVideo.currentTime !== 0) bookingVideo.currentTime = 0;
        bookingVideoStopped = false;
      } else if (bookingVideoStopped) {
        if (!bookingVideo.paused) bookingVideo.pause();
      } else if (bookingVideo.currentTime >= bookingVideoMaxTime) {
        bookingVideoStopped = true;
        if (!bookingVideo.paused) bookingVideo.pause();
        if (bookingVideo.currentTime > bookingVideoMaxTime) bookingVideo.currentTime = bookingVideoMaxTime;
        bookingVideo.classList.remove('is-active');
      } else if (bookingVideo.paused && !bookingVideo.ended) {
        bookingVideo.currentTime = 0;
        bookingVideo.play().catch(() => {});
      }
    };
    syncBookingDemo();
    window.setInterval(syncBookingDemo, 120);
    const bookingCopy = bookingCard.querySelector('.booking-entry__copy > p');
    if (bookingCopy) bookingCopy.remove();
    const bookingButton = bookingCard.querySelector('.booking-entry__copy .button');
    const bookingQrCard = bookingCard.querySelector('.booking-entry__copy .booking-qr-card');
    if (bookingButton && bookingQrCard) bookingQrCard.before(bookingButton);
  }
  const grid = document.querySelector('#content-grid');
  if (grid && window.SHU_YI_CONTENT) {
    const renderContent = (filter = 'all') => { const items = window.SHU_YI_CONTENT.filter((item) => filter === 'all' || item.type === filter); grid.innerHTML = items.map((item) => { const title = escapeHtml(item.title); const cover = item.cover ? `<img class="card-cover" src="${escapeHtml(item.cover)}" alt="${title}">` : ''; const visual = cover || (item.type === 'video' ? `<button class="card-play" ${item.embed_url ? `data-youtube="${escapeHtml(item.embed_url)}"` : `data-video="${escapeHtml(item.video)}"`} aria-label="播放 ${title}">▶</button>` : `<span>${escapeHtml(item.type).toUpperCase()}</span>`); return `<article class="content-card content-card--${escapeHtml(item.accent)}"><div class="card-art">${visual}</div><div class="card-meta"><span>${escapeHtml(item.tag)}</span><span>${escapeHtml(item.date)}</span></div><h3>${title}</h3><p>${escapeHtml(item.excerpt)}</p><a href="${escapeHtml(item.href)}">閱讀內容 <span>→</span></a></article>`; }).join(''); };
    renderContent();
    document.addEventListener('shuyi-content-ready', () => renderContent());
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-selected', 'false'); }); button.classList.add('is-active'); button.setAttribute('aria-selected', 'true'); renderContent(button.dataset.filter); }));
  }
  const videoDialog = document.querySelector('#video-dialog'); const dialogVideo = document.querySelector('#dialog-video');
  if (videoDialog && dialogVideo) { const dialogYoutube = document.createElement('iframe'); dialogYoutube.id = 'dialog-youtube'; dialogYoutube.title = 'YouTube 影片'; dialogYoutube.hidden = true; dialogYoutube.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; dialogYoutube.allowFullscreen = true; dialogVideo.after(dialogYoutube); document.addEventListener('click', (event) => { const play = event.target.closest('[data-video],[data-youtube]'); if (!play) return; event.preventDefault(); if (play.dataset.youtube) { dialogVideo.pause(); dialogVideo.removeAttribute('src'); dialogVideo.hidden = true; dialogYoutube.src = play.dataset.youtube; dialogYoutube.hidden = false; } else { dialogYoutube.removeAttribute('src'); dialogYoutube.hidden = true; dialogVideo.hidden = false; dialogVideo.src = play.dataset.video; dialogVideo.play(); } videoDialog.showModal(); }); videoDialog.querySelector('.dialog-close').addEventListener('click', () => { dialogVideo.pause(); dialogVideo.removeAttribute('src'); dialogYoutube.removeAttribute('src'); videoDialog.close(); }); }
  document.body.style.visibility = 'visible';
  document.body.style.animation = 'none';
})();
