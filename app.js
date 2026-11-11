(() => {
  if (!document.querySelector('link[rel="icon"]')) { const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.type = 'image/jpeg'; favicon.href = '/素材/淺色系-1K.jpeg'; document.head.append(favicon); }
  const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  const bookingGuide = document.querySelector('.booking-info');
  if (bookingGuide && !bookingGuide.querySelector('.booking-policy')) {
    bookingGuide.querySelector('.booking-guide__lead')?.remove();
    bookingGuide.insertAdjacentHTML('beforeend', '<section class="booking-policy" aria-labelledby="booking-policy-title"><div class="booking-policy__heading"><p class="eyebrow">A LITTLE NOTE BEFORE YOU COME</p><h2 id="booking-policy-title">💜 為了讓每位客人都能<br><em>順利安排調理時間</em></h2></div><ul class="booking-policy__list"><li><span aria-hidden="true">✓</span><p>請準時赴約，若遲到將依原預約時段安排，以免影響下一位客人的預約。</p></li><li><span aria-hidden="true">✓</span><p>如需取消或更改預約，請於 4 小時前通知我們。</p></li><li><span aria-hidden="true">✓</span><p>無故未到或臨時取消累積 2 次，未來預約可能需支付定金。</p></li></ul></section>');
  }
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
  const typewrite = (element, text) => new Promise((resolve) => {
    element.classList.add('journal-typewriter');
    element.setAttribute('aria-label', text);
    element.textContent = '';
    let textIndex = 0;
    const typeNext = () => {
      if (textIndex >= text.length) { resolve(); return; }
      const character = text[textIndex++];
      element.textContent += character;
      window.setTimeout(typeNext, /[，。；]/.test(character) ? 180 : 30);
    };
    typeNext();
  });
  document.querySelectorAll('.site-nav').forEach((nav) => { const journalLink = [...nav.querySelectorAll('a')].find((link) => normalizePath(new URL(link.href, window.location.href).pathname) === '/journal'); if (journalLink) { journalLink.textContent = '更懂自己'; if (!nav.querySelector('.nav-service-details')) journalLink.insertAdjacentHTML('afterend', '<a class="nav-service-details" href="/offerings/">服務項目</a>'); } });
  if (currentPath === '/services') { const serviceStyles = document.querySelector('link[href*="styles.css"]'); if (serviceStyles) serviceStyles.href = `${serviceStyles.href.split('?')[0]}?v=services-v2-20261029`; }
  if (currentPath === '/services') { const callout = document.querySelector('.callout'); if (callout && !callout.querySelector('.callout__signal')) callout.insertAdjacentHTML('beforeend', '<div class="callout__signal" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'); }
  if (currentPath === '/journal') { const journalTitle = document.querySelector('.journal-page .page-hero h1'); const journalLead = document.querySelector('.journal-page .page-hero__lead'); const journalText = '讓舒適的身體，習以為常。從身體感受開始，探索活動、日常與那些讓自己更舒服的細節；每一篇，都是舒逸正在累積的身體筆記。'; if (journalTitle) journalTitle.innerHTML = '讓舒適的身體<br><em>習以為常</em>'; if (journalLead) { journalLead.classList.add('journal-typewriter'); journalLead.setAttribute('aria-label', journalText); journalLead.textContent = ''; let textIndex = 0; const typeNext = () => { if (textIndex >= journalText.length) return; const character = journalText[textIndex]; journalLead.textContent += character; textIndex += 1; window.setTimeout(typeNext, /[，。；]/.test(character) ? 180 : 30); }; typeNext(); } }
  if (currentPath === '/') { const journalLinkTitle = document.querySelector('.home-link[href*="journal"] h2'); if (journalLinkTitle) journalLinkTitle.innerHTML = '讓舒適的身體<br><em>習以為常</em>'; }
  document.querySelectorAll('.site-nav a').forEach((link) => { const linkUrl = new URL(link.href, window.location.href); const isCurrent = normalizePath(linkUrl.pathname) === currentPath && (!link.classList.contains('nav-service-details') || window.location.hash === '#service-menu' || currentPath === '/offerings'); link.classList.toggle('is-current', isCurrent); if (isCurrent) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); link.addEventListener('click', () => document.body.classList.remove('menu-open')); });
  const serviceHero = document.querySelector('.page-hero');
  if (serviceHero && currentPath === '/services' && !serviceHero.classList.contains('page-hero--service')) {
    const copy = document.createElement('div');
    copy.className = 'page-hero__copy';
    while (serviceHero.firstChild) copy.append(serviceHero.firstChild);
    const art = document.createElement('div');
    art.className = 'service-hero-art service-hero-art--scan-error';
    art.setAttribute('aria-label', '身體訊號的抽象示意動畫');
    art.innerHTML = '<div class="service-spine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="service-hero-art__status"><span></span><span>身體訊號</span></div>';
    serviceHero.classList.add('page-hero--service');
    serviceHero.append(copy, art);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const nodes = [...art.querySelectorAll('.service-spine i')];
      const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));
      const clearNodes = () => nodes.forEach((node) => node.classList.remove('is-scanned', 'is-error', 'is-repaired', 'is-repairing', 'is-restoring', 'is-normalized'));
      const scanDown = async () => {
        art.classList.remove('phase-repair', 'phase-release');
        art.classList.add('phase-scan');
        clearNodes();
        for (let index = 0; index < nodes.length; index += 1) {
          const node = nodes[index];
          node.classList.add('is-scanned');
          if (index === 3 || index === 7) {
            await wait(220);
            node.classList.add('is-error');
            await wait(630);
          } else await wait(430);
        }
        await wait(260);
        repairDown();
      };
      const repairDown = async () => {
        art.classList.remove('phase-scan');
        art.classList.add('phase-repair');
        await wait(350);
        for (const index of [3, 7]) {
          nodes[index].classList.add('is-repairing');
          await wait(900);
          nodes[index].classList.remove('is-repairing');
          nodes[index].classList.add('is-repaired');
          await wait(300);
        }
        releaseDown();
      };
      const releaseDown = async () => {
        art.classList.remove('phase-repair');
        art.classList.add('phase-release');
        await wait(300);
        for (let index = 0; index < nodes.length; index += 1) {
          const node = nodes[index];
          node.classList.remove('is-scanned');
          if (index === 3 || index === 7) {
            node.classList.add('is-restoring');
            await wait(430);
            node.classList.remove('is-restoring', 'is-repaired', 'is-error');
            node.classList.add('is-normalized');
          } else await wait(430);
        }
        await wait(900);
        scanDown();
      };
      scanDown();
    }
  }
  document.querySelectorAll('.hero h1, .page-hero h1, .booking-card h1, .studio-page__copy h1').forEach((heading) => { heading.innerHTML = heading.innerHTML.replaceAll('。', ''); });
  const heroStamp = document.querySelector('.hero-stamp');
  if (heroStamp) { const words = ['MOVE', 'WELL', 'LIVE', 'LIGHT']; heroStamp.setAttribute('aria-label', words.join(' ')); heroStamp.innerHTML = words.map((word, index) => `<span style="--word-index:${index}">${word}</span>`).join(''); }
  const setupHeroCrystal = (hero, sphere, reduceMotion) => {
    const backdrop = hero?.querySelector('.hero-backdrop');
    const canvas = sphere?.querySelector('.hero-crystal__refraction');
    const output = canvas?.getContext('2d');
    if (!hero || !sphere || !output) return;
    const scene = document.createElement('canvas');
    const sceneContext = scene.getContext('2d', { willReadFrequently:true });
    if (!sceneContext) return;
    let pixels = null;
    let sourceScale = 1;
    let frame = 0;
    let lastFrame = 0;
    const quality = Math.min(window.devicePixelRatio || 1, 1.1);
    const rebuildScene = () => {
      if (backdrop && (!backdrop.complete || !backdrop.naturalWidth)) return;
      const bounds = hero.getBoundingClientRect();
      scene.width = Math.max(1, Math.round(bounds.width * quality));
      scene.height = Math.max(1, Math.round(bounds.height * quality));
      sourceScale = scene.width / Math.max(1, bounds.width);
      sceneContext.clearRect(0, 0, scene.width, scene.height);
      const dark = document.documentElement.dataset.theme === 'dark';
      if (backdrop) {
        const scale = Math.max(scene.width / backdrop.naturalWidth, scene.height / backdrop.naturalHeight);
        const drawWidth = backdrop.naturalWidth * scale;
        const drawHeight = backdrop.naturalHeight * scale;
        sceneContext.drawImage(backdrop, (scene.width - drawWidth) * .5, (scene.height - drawHeight) * .5, drawWidth, drawHeight);
        const tint = sceneContext.createLinearGradient(0, 0, scene.width, scene.height);
        tint.addColorStop(0, dark ? 'rgba(24,17,22,.48)' : 'rgba(255,248,244,.4)');
        tint.addColorStop(1, dark ? 'rgba(24,17,22,.16)' : 'rgba(255,248,244,.12)');
        sceneContext.fillStyle = tint;
        sceneContext.fillRect(0, 0, scene.width, scene.height);
      } else {
        const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || (dark ? '#17171b' : '#f5f6f6');
        sceneContext.fillStyle = background;
        sceneContext.fillRect(0, 0, scene.width, scene.height);
        sceneContext.strokeStyle = dark ? 'rgba(232,237,240,.09)' : 'rgba(88,110,124,.12)';
        sceneContext.lineWidth = Math.max(1, quality);
        const spacing = 26 * quality;
        sceneContext.beginPath();
        for (let x = 0; x <= scene.width; x += spacing) { sceneContext.moveTo(x, 0); sceneContext.lineTo(x, scene.height); }
        for (let y = 0; y <= scene.height; y += spacing) { sceneContext.moveTo(0, y); sceneContext.lineTo(scene.width, y); }
        sceneContext.stroke();
      }
      pixels = sceneContext.getImageData(0, 0, scene.width, scene.height).data;
      draw(performance.now());
    };
    const draw = (time) => {
      if (!pixels) return;
      const heroBounds = hero.getBoundingClientRect();
      const sphereBounds = sphere.getBoundingClientRect();
      const width = Math.max(1, Math.round(sphereBounds.width * quality));
      const height = Math.max(1, Math.round(sphereBounds.height * quality));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      const image = output.createImageData(width, height);
      const data = image.data;
      const radius = Math.min(width, height) / 2;
      const centerX = width / 2;
      const centerY = height / 2;
      const originX = (sphereBounds.left - heroBounds.left) * sourceScale;
      const originY = (sphereBounds.top - heroBounds.top) * sourceScale;
      const wavePhase = time * .0011;
      for (let y = 0; y < height; y += 1) {
        const dy = y + .5 - centerY;
        const ny = dy / radius;
        for (let x = 0; x < width; x += 1) {
          const dx = x + .5 - centerX;
          const nx = dx / radius;
          const distance = Math.sqrt(nx * nx + ny * ny);
          if (distance >= 1) continue;
          const bulge = 1 - distance * distance;
          const magnification = 1 + .16 * bulge;
          const ripple = Math.sin((nx * .8 + ny * .56) * 7 + wavePhase) * 4.5 * bulge * quality;
          const sx = Math.max(0, Math.min(scene.width - 1, Math.round(originX + centerX + dx / magnification + ripple * ny)));
          const sy = Math.max(0, Math.min(scene.height - 1, Math.round(originY + centerY + dy / magnification + ripple * nx)));
          const sourceIndex = (sy * scene.width + sx) * 4;
          const redIndex = (sy * scene.width + Math.min(scene.width - 1, sx + Math.round(nx * 2 * bulge))) * 4;
          const blueIndex = (sy * scene.width + Math.max(0, sx - Math.round(nx * 2 * bulge))) * 4;
          const targetIndex = (y * width + x) * 4;
          const edgeFade = Math.min(1, (1 - distance) * 11);
          data[targetIndex] = pixels[redIndex];
          data[targetIndex + 1] = pixels[sourceIndex + 1];
          data[targetIndex + 2] = pixels[blueIndex + 2];
          data[targetIndex + 3] = Math.round(224 * edgeFade);
        }
      }
      output.putImageData(image, 0, 0);
    };
    const render = (time) => {
      frame = requestAnimationFrame(render);
      if (document.visibilityState !== 'visible' || time - lastFrame < 40) return;
      lastFrame = time;
      draw(time);
    };
    const onResize = () => { rebuildScene(); };
    backdrop?.addEventListener('load', rebuildScene, { once:true });
    window.addEventListener('resize', onResize, { passive:true });
    new MutationObserver(rebuildScene).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
    if (!backdrop || backdrop.complete) rebuildScene();
    if (!reduceMotion) frame = requestAnimationFrame(render);
    else if (!pixels && (!backdrop || backdrop.complete)) rebuildScene();
    const drift = () => {
      if (reduceMotion || !hero.isConnected || document.visibilityState !== 'visible') return;
      const heroBounds = hero.getBoundingClientRect();
      const sphereBounds = sphere.getBoundingClientRect();
      const mobile = window.matchMedia('(max-width:720px)').matches;
      const centerX = 50;
      const centerY = 50;
      const minX = centerX - 1.1;
      const maxX = centerX + 1.1;
      const minY = centerY - 1.4;
      const maxY = centerY + 1.4;
      const rect = sphere.getBoundingClientRect();
      let currentX = (rect.left - heroBounds.left + rect.width / 2) / heroBounds.width * 100;
      let currentY = (rect.top - heroBounds.top + rect.height / 2) / heroBounds.height * 100;
      const choose = (low, high) => low + Math.random() * Math.max(1, high - low);
      let nextX = currentX;
      let nextY = currentY;
      for (let attempt = 0; attempt < 8 && Math.hypot(nextX - currentX, nextY - currentY) < .6; attempt += 1) {
        nextX = choose(minX, maxX);
        nextY = choose(minY, maxY);
      }
      const animation = sphere.animate([{ left:`${currentX}%`, top:`${currentY}%` }, { left:`${nextX}%`, top:`${nextY}%` }], { duration:18000 + Math.random() * 24000, easing:'cubic-bezier(.42,0,.28,1)', fill:'forwards' });
      animation.onfinish = () => {
        currentX = nextX;
        currentY = nextY;
        sphere.style.left = `${currentX}%`;
        sphere.style.top = `${currentY}%`;
        animation.cancel();
        window.setTimeout(drift, 700 + Math.random() * 1800);
      };
    };
    if (!reduceMotion) window.setTimeout(drift, 7000);
    return () => cancelAnimationFrame(frame);
  };
  const setupHeroOrbit = (hero, reduceMotion) => {
    const orbit = hero?.querySelector('.hero-orbit');
    const interaction = orbit?.querySelector('.hero-orbit__interaction');
    const items = [...(orbit?.querySelectorAll('.hero-orbit__item') || [])];
    if (!orbit || !interaction || items.length !== 5) return;
    const step = Math.PI * 2 / items.length;
    const state = { angle:0, target:0, velocity:0, lastInput:0, lastMove:performance.now(), lastFrame:performance.now(), lean:0, leanTarget:0, dragging:false, hover:-1 };
    const drag = { x:0, y:0, start:0, time:0, moved:false, down:false };
    let frame = 0;
    let introAnimations = [];
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const nearest = (angle) => ((Math.round(-angle / step) % items.length) + items.length) % items.length;
    const cancelIntro = () => {
      introAnimations.forEach((animation) => animation.cancel());
      introAnimations = [];
    };
    const render = (time = performance.now()) => {
      const width = Math.max(1, orbit.clientWidth);
      const height = Math.max(1, orbit.clientHeight);
      const mobile = matchMedia('(max-width:720px)').matches;
      const radius = Math.min(width * (mobile ? .34 : .39), mobile ? 176 : 380);
      const speedBlur = clamp(Math.abs(state.velocity) * .09, 0, .9);
      const active = nearest(state.angle);
      items.forEach((item, index) => {
        const angle = index * step + state.angle + state.lean;
        const cosine = Math.cos(angle);
        const x = Math.sin(angle) * radius;
        const y = cosine * radius * (mobile ? .58 : .20) + height * .04;
        const scale = .56 + (cosine + 1) * .27;
        const opacity = .34 + (.66 * (cosine + 1) / 2);
        const depthBlur = clamp(1 - cosine, 0, 2);
        const blur = clamp(depthBlur + speedBlur, 0, 2.6);
        item.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
        item.style.opacity = String(opacity.toFixed(3));
        item.style.filter = `blur(${blur.toFixed(2)}px) drop-shadow(0px 12px 9px color-mix(in srgb,var(--ink) 25%,transparent))`;
        item.style.zIndex = String(80 + Math.round((cosine + 1) * 35));
        item.dataset.active = String(index === active);
        item.dataset.depth = cosine > .35 ? 'front' : cosine < -.35 ? 'back' : 'middle';
        item.setAttribute('aria-label', item.dataset.label || item.textContent.trim());
      });
      const logo = orbit.querySelector('.hero-stage');
      if (logo) logo.style.zIndex = '108';
    };
    const update = (time) => {
      frame = requestAnimationFrame(update);
      const dt = clamp((time - state.lastFrame) / 1000, 0, .08);
      state.lastFrame = time;
      if (!reduceMotion) {
        const idle = time - state.lastInput;
        if (state.dragging || idle < 60) state.velocity *= Math.exp(-dt * 4);
        const snapping = !state.dragging && state.lastInput > 0 && idle > 130;
        if (snapping) {
          const bias = Math.abs(state.velocity) > .04 ? Math.sign(state.velocity) * .4 : 0;
          state.target = Math.round(state.target / step + bias) * step;
        }
        state.angle += (state.target - state.angle) * (1 - Math.exp(-(snapping ? 6 : 12) * dt));
        if (Math.abs(state.angle - state.target) < .0001) state.angle = state.target;
        state.lean += (state.leanTarget - state.lean) * (1 - Math.exp(-4 * dt));
      } else state.angle = state.target;
      render(time);
    };
    const pointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      cancelIntro();
      drag.down = true;
      drag.moved = false;
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.start = state.target;
      drag.time = performance.now();
      state.dragging = true;
      interaction.classList.add('is-grabbing');
    };
    const pointerMove = (event) => {
      if (drag.down) {
        const now = performance.now();
        const dt = clamp((now - drag.time) / 1000, .008, .1);
        const delta = event.clientX - drag.x;
        if (Math.abs(delta) > 5 || Math.abs(event.clientY - drag.y) > 5) drag.moved = true;
        const next = drag.start + delta / Math.max(1, window.innerWidth) * 2;
        state.velocity = clamp((next - state.target) / dt, -7, 7);
        state.target = next;
        state.lastInput = now;
        drag.time = now;
        drag.start = next;
        drag.x = event.clientX;
        state.leanTarget = 0;
      } else if (interaction.contains(event.target) || orbit.contains(event.target)) {
        const x = (event.clientX / Math.max(1, window.innerWidth) - .5) * 2;
        const y = (event.clientY / Math.max(1, window.innerHeight) - .5) * 2;
        state.leanTarget = -x * .11 * (1 + Math.max(0, -y) * .55);
        const hovered = event.target.closest?.('.hero-orbit__item');
        state.hover = hovered ? items.indexOf(hovered) : -1;
      }
    };
    const pointerEnd = () => {
      if (!drag.down) return;
      drag.down = false;
      state.dragging = false;
      interaction.classList.remove('is-grabbing');
      const reach = clamp(state.velocity * .20, -step, step);
      const bias = Math.abs(state.velocity) > .04 ? Math.sign(state.velocity) * .4 : 0;
      state.target = Math.round((state.target + reach) / step + bias) * step;
      state.lastInput = 0;
      if (drag.moved) window.setTimeout(() => { drag.moved = false; }, 320);
    };
    interaction.addEventListener('pointerdown', pointerDown);
    window.addEventListener('pointermove', pointerMove, { passive:true });
    window.addEventListener('pointerup', pointerEnd);
    window.addEventListener('pointercancel', pointerEnd);
    orbit.addEventListener('click', (event) => {
      if (!drag.moved) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      drag.moved = false;
    }, true);
    orbit.addEventListener('wheel', (event) => {
      if (event.ctrlKey || event.target.closest?.('button, [role=dialog]')) return;
      event.preventDefault();
      cancelIntro();
      const dt = clamp((performance.now() - state.lastMove) / 1000, .008, .1);
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      const raw = clamp((Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX) * unit, -240, 240);
      const delta = raw * .0022;
      state.target -= delta;
      const sample = clamp(-delta / dt, -7, 7);
      state.velocity = state.velocity * .6 + sample * .4;
      state.lastMove = performance.now();
      state.lastInput = state.lastMove;
    }, { passive:false });
    orbit.addEventListener('keydown', (event) => {
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); state.target -= step; state.velocity = 0; state.lastInput = performance.now(); }
      else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); state.target += step; state.velocity = 0; state.lastInput = performance.now(); }
    });
    window.addEventListener('resize', () => render());
    render();
    if (!reduceMotion) {
      requestAnimationFrame(() => {
        const order = items.map((item, index) => ({ item, index, depth:Math.cos(index * step) })).sort((a, b) => Math.abs(b.depth) - Math.abs(a.depth));
        order.forEach(({ item, index }, rank) => {
          const destination = item.style.transform;
          const opacity = item.style.opacity;
          const filter = item.style.filter;
          const animation = item.animate([
            { transform:destination.replace(/scale\([^)]+\)$/, 'scale(.05)'), opacity:0, filter:'blur(14px)' },
            { transform:destination, opacity, filter }
          ], { duration:820, delay:240 + rank * 115, easing:'cubic-bezier(.2,.8,.2,1)', fill:'both' });
          introAnimations.push(animation);
          animation.onfinish = () => { animation.cancel(); introAnimations = introAnimations.filter((activeAnimation) => activeAnimation !== animation); render(); };
        });
      });
      frame = requestAnimationFrame(update);
    }
    return () => { cancelAnimationFrame(frame); cancelIntro(); };
  };
  const homeHero = document.querySelector('.hero');
  if (homeHero) {
    const heroStage = homeHero.querySelector('.hero-stage');
    const heroSphere = homeHero.querySelector('.hero-stage__move');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    homeHero.classList.add('home-intro');
    setupHeroCrystal(homeHero, heroSphere, reduceMotion);
    setupHeroOrbit(homeHero, reduceMotion);
    if (!reduceMotion) {
      if (heroSphere) {
        heroSphere.classList.add('hero-stage--intro');
        window.setTimeout(() => {
          heroSphere.classList.remove('hero-stage--intro');
        }, 1800);
      }
      const homeMotionTargets = [...document.querySelectorAll('.home-links .home-link, .motion-copy h2')];
      homeMotionTargets.forEach((element, index) => {
        if (element.matches('.home-links .home-link')) element.classList.add('home-link-reveal');
        else element.classList.add(index % 2 ? 'clip-reveal--right' : 'text-mask-reveal');
      });
      const revealHomeMotion = () => {
        homeMotionTargets.forEach((element) => {
          const bounds = element.getBoundingClientRect();
          if (bounds.top < window.innerHeight * .92 && bounds.bottom > 0) element.classList.add('is-motion-visible');
        });
      };
      requestAnimationFrame(revealHomeMotion);
      window.addEventListener('scroll', revealHomeMotion, { passive:true });
    }
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) { const revealTargets = document.querySelectorAll('.section, .page-hero, .article, .booking-card, .studio-page__copy, .service-list article'); revealTargets.forEach((element, index) => { element.classList.add('reveal-on-scroll'); element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`); }); const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .12 }); revealTargets.forEach((element) => observer.observe(element)); }
  const serviceList = document.querySelector('.service-list');
  if (serviceList && !document.querySelector('[data-flow-progress]')) {
    serviceList.closest('section').insertAdjacentHTML('afterend', '<section class="service-flow section" data-flow-progress><div class="service-flow__intro"><p class="eyebrow">THE SHU YI WAY / 02</p><h2>從理解開始<br><em>慢慢找回活動</em></h2><p>每一次調理都從當下狀態出發，在過程裡感受身體，再把合適的照顧帶回日常。</p></div><div class="service-flow__track"><div class="service-flow__line" aria-hidden="true"><i></i></div><ol class="service-flow__steps"><li class="service-flow__step is-active"><span>01</span><div><h3>先理解狀態</h3><p>從今天的身體感受與日常活動開始，找到舒服的起點。</p></div></li><li class="service-flow__step"><span>02</span><div><h3>安排活化節奏</h3><p>依當下狀態安排調理，不套用每個人都一樣的固定流程。</p></div></li><li class="service-flow__step"><span>03</span><div><h3>留意身體變化</h3><p>在過程中保持感受，讓活動與舒適度成為調整的方向。</p></div></li><li class="service-flow__step"><span>04</span><div><h3>帶回日常裡</h3><p>留下能延續到生活中的身體照顧空間，慢慢找回自在。</p></div></li></ol></div></section>');
  }
  const serviceFlow = document.querySelector('[data-flow-progress]');
  if (serviceFlow) {
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) { const flowSteps = [...serviceFlow.querySelectorAll('.service-flow__step')]; let flowRevealIndex = 0; let flowRevealTarget = -1; let flowRevealTimer = 0; const revealFlowThrough = (targetIndex) => { flowRevealTarget = Math.max(flowRevealTarget, Math.min(targetIndex, flowSteps.length - 1)); if (flowRevealTimer) return; const revealNext = () => { flowRevealTimer = 0; if (flowRevealIndex > flowRevealTarget) return; flowSteps[flowRevealIndex].classList.add('is-revealed'); flowRevealIndex += 1; if (flowRevealIndex <= flowRevealTarget) flowRevealTimer = window.setTimeout(revealNext, 240); }; revealNext(); }; const flowObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) revealFlowThrough(flowSteps.indexOf(entry.target)); }), { threshold: .12 }); flowSteps.forEach((step) => { step.classList.add('reveal-on-scroll'); flowObserver.observe(step); }); }
    const steps = [...serviceFlow.querySelectorAll('.service-flow__step')]; const progress = serviceFlow.querySelector('.service-flow__line i'); let progressFrame = 0;
    const updateFlow = () => { progressFrame = 0; const bounds = serviceFlow.getBoundingClientRect(); const travel = Math.max(bounds.height - window.innerHeight * .35, 1); const amount = Math.min(1, Math.max(0, (window.innerHeight * .32 - bounds.top) / travel)); if (progress) progress.style.transform = `scaleY(${amount})`; };
    window.addEventListener('scroll', () => { if (!progressFrame) progressFrame = requestAnimationFrame(updateFlow); }, { passive: true }); window.addEventListener('resize', updateFlow, { passive: true }); updateFlow();
    if ('IntersectionObserver' in window) { let activeStepIndex = 0; let activeStepTarget = 0; let activeStepTimer = 0; let previousScrollY = window.scrollY; const moveActiveStep = (targetIndex) => { activeStepTarget = Math.max(0, Math.min(targetIndex, steps.length - 1)); if (activeStepTimer) return; const advance = () => { activeStepTimer = 0; if (activeStepIndex === activeStepTarget) return; activeStepIndex += activeStepIndex < activeStepTarget ? 1 : -1; steps.forEach((step) => step.classList.remove('is-active')); steps[activeStepIndex].classList.add('is-active'); if (activeStepIndex !== activeStepTarget) activeStepTimer = window.setTimeout(advance, 180); }; advance(); }; const stepObserver = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => steps.indexOf(entry.target)).filter((index) => index >= 0); if (!visible.length) return; const scrollingDown = window.scrollY >= previousScrollY; previousScrollY = window.scrollY; moveActiveStep(scrollingDown ? Math.max(...visible) : Math.min(...visible)); }, { rootMargin: '-35% 0px -45% 0px', threshold: 0 }); steps.forEach((step) => stepObserver.observe(step)); }
  }
  const bookingCard = document.querySelector('.booking-card');
  if (bookingCard && !bookingCard.querySelector('[data-booking-entry]')) {
    bookingCard.classList.add('booking-card--ready');
    const intro = bookingCard.querySelector('p:not(.eyebrow)');
    const notice = bookingCard.querySelector('.booking-notice');
    if (intro) intro.remove();
    if (notice) notice.remove();
    const bookingPlatformUrl = document.querySelector('[data-booking-platform-outbound]')?.href || '/booking/';
    bookingCard.insertAdjacentHTML('beforeend', '<div class="booking-entry" data-booking-entry><div class="booking-browser" aria-label="掃描 QR Code 後開啟預約流程示意動畫"><div class="booking-browser__bar"><i></i><i></i><i></i><span>LINE → 舒逸線上預約平台</span></div><div class="booking-browser__body"><div class="booking-demo"><div class="booking-demo__scene"><div class="booking-demo__scan-target"><small>SCAN TO BOOK</small><img src="../素材/L_gainfriends_2dbarcodes_BW.png" alt="" aria-hidden="true"></div><div class="booking-demo__phone" aria-hidden="true"><div class="booking-demo__phone-screen"><video class="booking-demo__video" muted autoplay playsinline webkit-playsinline preload="auto" poster="../素材/預約流程登入介面.jpg"><source src="../素材/預約流程影片.mp4" type="video/mp4"></video></div></div><span class="booking-demo__scan-line" aria-hidden="true"></span><span class="booking-demo__caption booking-demo__caption--scan">掃描 QR Code</span><span class="booking-demo__caption booking-demo__caption--login">LINE 登入</span><span class="booking-demo__caption booking-demo__caption--flow">進入預約流程</span></div><div class="booking-demo__status"><span></span><b>預約入口示意</b><em>QR → 登入 → 預約</em></div></div></div></div><div class="booking-entry__copy"><a class="booking-qr-card" href="https://lin.ee/5lABDTv" target="_blank" rel="noopener" data-analytics-target="line_official"><img src="../素材/L_gainfriends_2dbarcodes_BW.png" alt="掃描或點擊加入舒逸 LINE 官方帳號"><span>掃描或點擊加入 LINE@</span></a><p>加入 LINE@，可以先詢問服務內容；需要預約時，再前往舒逸預約平台選擇時間。</p><a class="button button--primary" data-booking-cta="true" data-booking-platform-outbound="true" href="' + escapeHtml(bookingPlatformUrl) + '" target="_blank" rel="noopener">前往舒逸線上預約 <span>↗</span></a></div></div>');
    const bookingSteps = bookingCard.querySelector('.booking-browser__bar span');
    if (bookingSteps) bookingSteps.className = 'booking-browser__steps';
    if (bookingSteps) bookingSteps.innerHTML = '<b class="booking-browser__step booking-browser__step--scan">01 / 掃 QR Code 或點連結</b><b class="booking-browser__step booking-browser__step--login">02 / 登入 LINE</b><b class="booking-browser__step booking-browser__step--time">03 / 選日期與時間</b><b class="booking-browser__step booking-browser__step--service">04 / 選服務項目</b><b class="booking-browser__step booking-browser__step--confirm">05 / 確認預約</b>';
    const bookingVideo = bookingCard.querySelector('.booking-demo__video');
    if (bookingVideo) { bookingVideo.loop = false; bookingVideo.muted = true; bookingVideo.playsInline = true; bookingVideo.preload = 'auto'; }
    const bookingStepItems = [...bookingCard.querySelectorAll('.booking-browser__step')];
    const bookingCycleMs = 29000;
    const bookingScanMs = 4500;
    const bookingLoginMs = 10500;
    const bookingTimeMs = 14500;
    const bookingServiceMs = 18000;
    const bookingVideoMaxTime = 19;
    const bookingVideoFadeStart = 18.5;
    let bookingVideoStopped = false;
    let bookingVideoReady = false;
    let bookingPreviousPhase = 0;
    const bookingCycleStarted = performance.now();
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
      const tryStartBookingVideo = () => {
        bookingVideoReady = bookingVideo.readyState >= 2;
        if (bookingVideoReady && !bookingVideoStopped && performance.now() - bookingCycleStarted >= bookingScanMs) bookingVideo.play().catch(() => {});
      };
      bookingVideo.addEventListener('loadeddata', tryStartBookingVideo, { once:false });
      bookingVideo.addEventListener('canplay', tryStartBookingVideo, { once:false });
      bookingVideo.addEventListener('timeupdate', stopBookingVideoAtLimit);
      bookingVideo.addEventListener('ended', () => {
        bookingVideoStopped = true;
        bookingVideo.classList.remove('is-active');
      });
      bookingVideo.load();
    }
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
      } else if (bookingVideo.paused && !bookingVideo.ended && (bookingVideoReady || bookingVideo.readyState >= 2)) {
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
  if (grid) {
    let activeFilter = 'all';
    const returnStateKey = 'shuyi-journal-return';
    const restoreListPosition = () => {
      if (window.location.hash !== '#journal-return') return;
      let saved;
      try { saved = JSON.parse(sessionStorage.getItem(returnStateKey) || 'null'); } catch { saved = null; }
      if (!saved) return;
      activeFilter = saved.filter || 'all';
      const selected = document.querySelector(`[data-filter="${activeFilter}"]`);
      if (selected) {
        document.querySelectorAll('[data-filter]').forEach((button) => { button.classList.toggle('is-active', button === selected); button.setAttribute('aria-selected', String(button === selected)); });
      }
      renderContent();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.scrollTo(0, Number(saved.scrollY) || 0);
        sessionStorage.removeItem(returnStateKey);
      }));
    };
    grid.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link || !/^\.\/|^\/journal\//.test(link.getAttribute('href') || '')) return;
      try { sessionStorage.setItem(returnStateKey, JSON.stringify({ scrollY: window.scrollY, filter: activeFilter })); } catch {}
    });
    const renderContent = () => {
      if (!Array.isArray(window.SHU_YI_CONTENT)) {
        grid.querySelectorAll('[data-content-type]').forEach((card) => { card.hidden = activeFilter !== 'all' && card.dataset.contentType !== activeFilter; });
        return;
      }
      const items = window.SHU_YI_CONTENT.filter((item) => activeFilter === 'all' || item.type === activeFilter);
      grid.innerHTML = items.map((item) => { const title = escapeHtml(item.title); const href = escapeHtml(item.href); const cover = item.cover ? `<a class="card-art-link" href="${href}" aria-label="閱讀文章：${title}"><img class="card-cover" src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.imageAlt)}" loading="lazy"></a>` : ''; const visual = cover || (item.type === 'video' ? `<button class="card-play" ${item.embed_url ? `data-youtube="${escapeHtml(item.embed_url)}"` : `data-video="${escapeHtml(item.video)}"`} aria-label="播放 ${title}">▶</button>` : `<span>${escapeHtml(item.type).toUpperCase()}</span>`); return `<article class="content-card content-card--${escapeHtml(item.accent)}" data-content-type="${escapeHtml(item.type)}"><div class="card-art">${visual}</div><div class="card-meta"><span>${escapeHtml(item.tag)}</span><span>${escapeHtml(item.date)}</span></div><h3>${title}</h3><p>${escapeHtml(item.excerpt)}</p><a href="${href}">閱讀內容 <span>→</span></a></article>`; }).join('');
    };
    renderContent();
    document.addEventListener('shuyi-content-ready', renderContent);
    if (window.SHU_YI_CONTENT_READY && typeof window.SHU_YI_CONTENT_READY.then === 'function') window.SHU_YI_CONTENT_READY.then(restoreListPosition);
    else restoreListPosition();
    document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('[data-filter]').forEach((item) => { item.classList.remove('is-active'); item.setAttribute('aria-selected', 'false'); }); button.classList.add('is-active'); button.setAttribute('aria-selected', 'true'); activeFilter = button.dataset.filter; renderContent(); }));
  }
  const videoDialog = document.querySelector('#video-dialog'); const dialogVideo = document.querySelector('#dialog-video');
  if (videoDialog && dialogVideo) { const dialogYoutube = document.createElement('iframe'); dialogYoutube.id = 'dialog-youtube'; dialogYoutube.title = 'YouTube 影片'; dialogYoutube.hidden = true; dialogYoutube.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; dialogYoutube.allowFullscreen = true; dialogVideo.after(dialogYoutube); document.addEventListener('click', (event) => { const play = event.target.closest('[data-video],[data-youtube]'); if (!play) return; event.preventDefault(); if (play.dataset.youtube) { dialogVideo.pause(); dialogVideo.removeAttribute('src'); dialogVideo.hidden = true; dialogYoutube.src = play.dataset.youtube; dialogYoutube.hidden = false; } else { dialogYoutube.removeAttribute('src'); dialogYoutube.hidden = true; dialogVideo.hidden = false; dialogVideo.src = play.dataset.video; dialogVideo.play(); } videoDialog.showModal(); }); videoDialog.querySelector('.dialog-close').addEventListener('click', () => { dialogVideo.pause(); dialogVideo.removeAttribute('src'); dialogYoutube.removeAttribute('src'); videoDialog.close(); }); }
  document.body.style.visibility = 'visible';
  document.body.style.animation = 'none';
})();
