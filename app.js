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
  if (currentPath === '/services') { const serviceStyles = document.querySelector('link[href*="styles.css"]'); if (serviceStyles) serviceStyles.href = `${serviceStyles.href.split('?')[0]}?v=services-hero-balance-20261112i`; }
  if (currentPath === '/services') { const callout = document.querySelector('.callout'); if (callout && !callout.querySelector('.callout__signal')) callout.insertAdjacentHTML('beforeend', '<div class="callout__signal" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'); }
  if (currentPath === '/journal') { const journalTitle = document.querySelector('.journal-page .page-hero h1'); const journalLead = document.querySelector('.journal-page .page-hero__lead'); const journalText = '讓舒適的身體，習以為常。從身體感受開始，探索活動、日常與那些讓自己更舒服的細節；每一篇，都是舒逸正在累積的身體筆記。'; if (journalTitle) journalTitle.innerHTML = '讓舒適的身體<br><em>習以為常</em>'; if (journalLead) { journalLead.classList.add('journal-typewriter'); journalLead.setAttribute('aria-label', journalText); journalLead.textContent = ''; let textIndex = 0; const typeNext = () => { if (textIndex >= journalText.length) return; const character = journalText[textIndex]; journalLead.textContent += character; textIndex += 1; window.setTimeout(typeNext, /[，。；]/.test(character) ? 180 : 30); }; typeNext(); } }
  if (currentPath === '/') { const journalLinkTitle = document.querySelector('.home-link[href*="journal"] h2'); if (journalLinkTitle) journalLinkTitle.innerHTML = '讓舒適的身體<br><em>習以為常</em>'; }
  document.querySelectorAll('.site-nav a').forEach((link) => { const linkUrl = new URL(link.href, window.location.href); const isCurrent = normalizePath(linkUrl.pathname) === currentPath && (!link.classList.contains('nav-service-details') || window.location.hash === '#service-menu' || currentPath === '/offerings'); link.classList.toggle('is-current', isCurrent); if (isCurrent) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); link.addEventListener('click', () => document.body.classList.remove('menu-open')); });
  const serviceHero = document.querySelector('.page-hero');
  if (serviceHero && currentPath === '/services' && !serviceHero.classList.contains('page-hero--service')) {
    const copy = document.createElement('div');
    copy.className = 'page-hero__copy';
    while (serviceHero.firstChild) copy.append(serviceHero.firstChild);
    serviceHero.classList.add('page-hero--service');
    const art = document.createElement('div');
    art.className = 'service-hero-art service-hero-art--scan-error';
    art.setAttribute('aria-label', '身體訊號的抽象示意動畫');
    art.innerHTML = '<div class="service-spine" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="service-hero-art__status"><span></span><span>身體訊號</span></div>';
    const canvas = document.createElement('canvas');
    canvas.className = 'service-hero-relight';
    canvas.setAttribute('aria-hidden', 'true');
    const wash = document.createElement('div');
    wash.className = 'service-hero-wash';
    wash.setAttribute('aria-hidden', 'true');
    serviceHero.append(canvas, wash, art, copy);
    const gl = canvas.getContext('webgl', { alpha:false, antialias:false, powerPreference:'low-power' });
    if (gl) {
      const vertexSource = `attribute vec2 aPosition; varying vec2 vUv; void main(){ vUv=aPosition*.5+.5; gl_Position=vec4(aPosition,0.0,1.0); }`;
      const fragmentSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif
        varying vec2 vUv;
        uniform sampler2D uImage;
        uniform sampler2D uDepth;
        uniform vec2 uTexel;
        uniform vec2 uCoverScale;
        uniform vec2 uCoverPosition;
        uniform vec2 uPointer;
        uniform float uLightHeight;
        vec2 fitUv(vec2 screenUv){ return screenUv*uCoverScale+(1.0-uCoverScale)*uCoverPosition; }
        float depthAt(vec2 uv){ return texture2D(uDepth,clamp(uv,vec2(0.001),vec2(0.999))).r; }
        float luminanceAt(vec2 uv){ vec3 c=texture2D(uImage,clamp(uv,vec2(0.001),vec2(0.999))).rgb; return dot(c,vec3(.2126,.7152,.0722)); }
        void main(){
          vec2 uv=fitUv(vUv);
          vec3 base=texture2D(uImage,uv).rgb;
          vec2 depthStep=uTexel*3.0;
          float dl=depthAt(uv-vec2(depthStep.x,0.0));
          float dr=depthAt(uv+vec2(depthStep.x,0.0));
          float db=depthAt(uv-vec2(0.0,depthStep.y));
          float dt=depthAt(uv+vec2(0.0,depthStep.y));
          vec2 depthSlope=vec2(dr-dl,dt-db)*0.5;
          vec2 detailStep=uTexel*7.0;
          vec2 detailSlope=vec2(
            luminanceAt(uv+vec2(detailStep.x,0.0))-luminanceAt(uv-vec2(detailStep.x,0.0)),
            luminanceAt(uv+vec2(0.0,detailStep.y))-luminanceAt(uv-vec2(0.0,detailStep.y))
          )*0.5;
          vec3 normal=normalize(vec3(-depthSlope*24.0-detailSlope*2.6,1.0));
          float depth=depthAt(uv);
          vec3 surface=vec3(vUv-0.5,(depth-1.0)*0.22);
          vec3 lightPosition=vec3(uPointer-0.5,uLightHeight);
          vec3 toLight=lightPosition-surface;
          float distanceSquared=dot(toLight,toLight);
          vec3 lightDirection=normalize(toLight);
          float diffuse=max(dot(normal,lightDirection),0.0);
          vec2 rayOffset=lightDirection.xy/max(lightDirection.z,0.16)*(1.0-depth)*0.28*uCoverScale;
          float occlusion=0.0;
          for(int i=0;i<10;i++){
            float progress=float(i+1)/10.0;
            float rayDepth=depth+(1.0-depth)*progress;
            float blocker=depthAt(uv+rayOffset*progress);
            occlusion=max(occlusion,smoothstep(rayDepth+0.018,rayDepth+0.12,blocker));
          }
          float visibility=1.0-occlusion*0.76;
          float attenuation=1.0/(1.0+distanceSquared*3.2);
          float specular=pow(max(dot(reflect(-lightDirection,normal),vec3(0.0,0.0,1.0)),0.0),28.0)*0.16;
          float illumination=0.54+diffuse*attenuation*1.32*visibility;
          vec3 relit=base*illumination+vec3(1.0,.91,.76)*specular*attenuation*visibility;
          gl_FragColor=vec4(relit,1.0);
        }`;
      const compileShader = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compile failed');
        return shader;
      };
      try {
        const program = gl.createProgram();
        gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
        gl.useProgram(program);
        const vertices = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
        const positionLocation = gl.getAttribLocation(program, 'aPosition');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        const uniforms = Object.fromEntries(['uImage','uDepth','uTexel','uCoverScale','uCoverPosition','uPointer','uLightHeight'].map((name) => [name, gl.getUniformLocation(program, name)]));
        const imageTexture = gl.createTexture();
        const depthTexture = gl.createTexture();
        const uploadTexture = (texture, image, unit) => {
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
          gl.uniform1i(unit === 0 ? uniforms.uImage : uniforms.uDepth, unit);
        };
        let lightX = .72;
        let lightY = .55;
        let coverPositionX = window.innerWidth <= 720 ? .64 : 1;
        let textureWidth = 1;
        let textureHeight = 1;
        let drawFrame = 0;
        let ready = false;
        const draw = () => {
          drawFrame = 0;
          if (!ready) return;
          const bounds = serviceHero.getBoundingClientRect();
          const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
          const width = Math.max(1, Math.round(bounds.width * ratio));
          const height = Math.max(1, Math.round(bounds.height * ratio));
          if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
          gl.viewport(0, 0, width, height);
          const imageAspect = textureWidth / textureHeight;
          const viewAspect = bounds.width / Math.max(bounds.height, 1);
          let coverX = 1, coverY = 1;
          if (imageAspect > viewAspect) coverX = viewAspect / imageAspect;
          else coverY = imageAspect / viewAspect;
          coverPositionX = bounds.width <= 720 ? .64 : 1;
          gl.uniform2f(uniforms.uTexel, 1 / textureWidth, 1 / textureHeight);
          gl.uniform2f(uniforms.uCoverScale, coverX, coverY);
          gl.uniform2f(uniforms.uCoverPosition, coverPositionX, .5);
          gl.uniform2f(uniforms.uPointer, lightX, lightY);
          gl.uniform1f(uniforms.uLightHeight, .62);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          canvas.classList.add('is-ready');
        };
        const queueDraw = () => { if (!drawFrame) drawFrame = requestAnimationFrame(draw); };
        const loadImage = (path) => new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = path;
        });
        Promise.all([loadImage('/素材/網站插圖/活化調理-首屏背景-背面.jpg'), loadImage('/素材/網站插圖/活化調理-首屏深度圖-背面.jpg')]).then(([image, depth]) => {
          textureWidth = image.width;
          textureHeight = image.height;
          uploadTexture(imageTexture, image, 0);
          uploadTexture(depthTexture, depth, 1);
          ready = true;
          queueDraw();
        }).catch(() => {});
        const moveRelight = (event) => {
          const bounds = serviceHero.getBoundingClientRect();
          lightX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
          lightY = 1 - Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
          if (window.innerWidth <= 720) coverPositionX = .64;
          queueDraw();
        };
        serviceHero.addEventListener('pointermove', moveRelight, { passive:true });
        serviceHero.addEventListener('pointerdown', moveRelight, { passive:true });
        serviceHero.addEventListener('pointerleave', (event) => {
          if (event.pointerType !== 'touch') { lightX = .72; lightY = .55; queueDraw(); }
        }, { passive:true });
        const resizeObserver = new ResizeObserver(queueDraw);
        resizeObserver.observe(serviceHero);
      } catch (error) {
        canvas.remove();
      }
    }
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
    const canvas = sphere?.querySelector('.hero-crystal__refraction');
    const output = canvas?.getContext('2d');
    if (!hero || !sphere || !output) return;
    const orbit = hero.querySelector('.hero-orbit');
    const visual = orbit?.querySelector('.hero-orbit__visual');
    const items = [...(orbit?.querySelectorAll('.hero-orbit__item') || [])];
    const hoverLabel = orbit?.querySelector('.hero-orbit__hover-label');
    if (!orbit || !items.length) return;
    const scene = document.createElement('canvas');
    const sceneContext = scene.getContext('2d', { willReadFrequently:true });
    const tailMask = document.createElement('canvas');
    const tailMaskContext = tailMask.getContext('2d', { willReadFrequently:true });
    if (!sceneContext || !tailMaskContext) return;
    let frame = 0;
    let lastFrame = 0;
    const quality = Math.min(window.devicePixelRatio || 1, 1.1);
    const draw = (time) => {
      const sphereBounds = sphere.getBoundingClientRect();
      const width = Math.max(1, Math.round(sphereBounds.width * quality));
      const height = Math.max(1, Math.round(sphereBounds.height * quality));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      if (scene.width !== width || scene.height !== height) { scene.width = width; scene.height = height; }
      if (tailMask.width !== width || tailMask.height !== height) { tailMask.width = width; tailMask.height = height; }
      sceneContext.clearRect(0, 0, width, height);
      tailMaskContext.clearRect(0, 0, width, height);
      // Rasterize only mascots whose orbit depth places them behind the glass.
      // The canvas then bends those live pixels, instead of drawing a fake grid.
      items.forEach((item) => {
        if (Number(item.style.zIndex) >= 84) return;
        const imageElement = item.querySelector('img');
        if (!imageElement?.complete || !imageElement.naturalWidth) return;
        const bounds = imageElement.getBoundingClientRect();
        const opacity = Number.parseFloat(item.style.opacity || '1');
        const blur = Number(item.style.filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0);
        sceneContext.save();
        sceneContext.globalAlpha = opacity;
        sceneContext.filter = blur ? `blur(${blur.toFixed(2)}px)` : 'none';
        sceneContext.drawImage(imageElement, (bounds.left - sphereBounds.left) * quality, (bounds.top - sphereBounds.top) * quality, bounds.width * quality, bounds.height * quality);
        sceneContext.restore();
      });
      if (hoverLabel?.dataset.behindGlass === 'true' && hoverLabel.classList.contains('is-visible')) {
        const bubble = hoverLabel.querySelector('span');
        if (bubble) {
          const bounds = bubble.getBoundingClientRect();
          const style = getComputedStyle(bubble);
          const labelStyle = getComputedStyle(hoverLabel);
          const x = (bounds.left - sphereBounds.left) * quality;
          const y = (bounds.top - sphereBounds.top) * quality;
          const w = bounds.width * quality;
          const h = bounds.height * quality;
          const tailX = Number.parseFloat(labelStyle.getPropertyValue('--bubble-tail-x')) * quality || w / 2;
          const radius = 24 * quality;
          const borderWidth = 2.25 * quality;
          const border = style.borderTopColor;
          const fill = style.backgroundColor;
          const isBelow = hoverLabel.classList.contains('is-below');
          sceneContext.save();
          sceneContext.globalAlpha = Number(labelStyle.opacity || 1);
          const bubbleBlur = Number(labelStyle.filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0);
          sceneContext.filter = bubbleBlur ? `blur(${(bubbleBlur * quality).toFixed(2)}px)` : 'none';
          // Paint the body first so its lower edge cannot cover the pale inner tail.
          sceneContext.fillStyle = border;
          sceneContext.beginPath();
          sceneContext.roundRect(x, y, w, h, radius);
          sceneContext.fill();
          sceneContext.fillStyle = fill;
          sceneContext.beginPath();
          sceneContext.roundRect(x + borderWidth, y + borderWidth, w - borderWidth * 2, h - borderWidth * 2, Math.max(2, radius - borderWidth));
          sceneContext.fill();
          // Draw both tail layers last; this keeps the pale inset visible when
          // the refracted bubble crosses the sphere edge in the rear half.
          sceneContext.fillStyle = border;
          sceneContext.beginPath();
          if (isBelow) {
            sceneContext.moveTo(x + tailX, y - 21 * quality);
            sceneContext.lineTo(x + tailX - 18 * quality, y + 3 * quality);
            sceneContext.lineTo(x + tailX + 18 * quality, y + 3 * quality);
          } else {
            sceneContext.moveTo(x + tailX, y + h + 21 * quality);
            sceneContext.lineTo(x + tailX - 18 * quality, y + h - 3 * quality);
            sceneContext.lineTo(x + tailX + 18 * quality, y + h - 3 * quality);
          }
          sceneContext.closePath();
          sceneContext.fill();
          sceneContext.fillStyle = fill;
          sceneContext.beginPath();
          if (isBelow) {
            sceneContext.moveTo(x + tailX, y - 16 * quality);
            sceneContext.lineTo(x + tailX - 13 * quality, y + 3 * quality);
            sceneContext.lineTo(x + tailX + 13 * quality, y + 3 * quality);
          } else {
            sceneContext.moveTo(x + tailX, y + h + 16 * quality);
            sceneContext.lineTo(x + tailX - 13 * quality, y + h - 3 * quality);
            sceneContext.lineTo(x + tailX + 13 * quality, y + h - 3 * quality);
          }
          sceneContext.closePath();
          sceneContext.fill();
          tailMaskContext.fillStyle = '#fff';
          tailMaskContext.beginPath();
          if (isBelow) {
            tailMaskContext.moveTo(x + tailX, y - 16 * quality);
            tailMaskContext.lineTo(x + tailX - 13 * quality, y + 3 * quality);
            tailMaskContext.lineTo(x + tailX + 13 * quality, y + 3 * quality);
          } else {
            tailMaskContext.moveTo(x + tailX, y + h + 16 * quality);
            tailMaskContext.lineTo(x + tailX - 13 * quality, y + h - 3 * quality);
            tailMaskContext.lineTo(x + tailX + 13 * quality, y + h - 3 * quality);
          }
          tailMaskContext.closePath();
          tailMaskContext.fill();
          sceneContext.fillStyle = style.color;
          sceneContext.font = getComputedStyle(bubble).font;
          sceneContext.textAlign = 'center';
          sceneContext.textBaseline = 'middle';
          sceneContext.fillText(bubble.textContent.trim(), x + w / 2, y + h / 2, w - 20 * quality);
          sceneContext.restore();
        }
      }
      const pixels = sceneContext.getImageData(0, 0, width, height).data;
      const tailPixels = tailMaskContext.getImageData(0, 0, width, height).data;
      const image = output.createImageData(width, height);
      const data = image.data;
      const radius = Math.min(width, height) / 2;
      const centerX = width / 2;
      const centerY = height / 2;
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
          const magnification = 1 + .48 * bulge;
          const ripple = Math.sin((nx * .8 + ny * .56) * 7 + wavePhase) * 6.5 * bulge * quality;
          const sx = Math.max(0, Math.min(scene.width - 1, Math.round(centerX + dx / magnification + ripple * ny)));
          const sy = Math.max(0, Math.min(scene.height - 1, Math.round(centerY + dy / magnification + ripple * nx)));
          const sourceIndex = (sy * scene.width + sx) * 4;
          const redIndex = (sy * scene.width + Math.min(scene.width - 1, sx + Math.round(nx * 2 * bulge))) * 4;
          const blueIndex = (sy * scene.width + Math.max(0, sx - Math.round(nx * 2 * bulge))) * 4;
          const targetIndex = (y * width + x) * 4;
          const edgeFade = Math.min(1, (1 - distance) * 11);
          data[targetIndex] = pixels[redIndex];
          data[targetIndex + 1] = pixels[sourceIndex + 1];
          data[targetIndex + 2] = pixels[blueIndex + 2];
          const isInnerTail = tailPixels[sourceIndex + 3] > 0;
          data[targetIndex + 3] = Math.round(pixels[sourceIndex + 3] * .92 * (isInnerTail ? Math.max(edgeFade, .78) : edgeFade));
        }
      }
      output.putImageData(image, 0, 0);
    };
    const render = (time) => {
      frame = requestAnimationFrame(render);
      if (document.visibilityState !== 'visible' || time - lastFrame < 40) return;
      lastFrame = time;
      draw(reduceMotion ? 0 : time);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  };
  const setupHeroOrbit = (hero, reduceMotion) => {
    const orbit = hero?.querySelector('.hero-orbit');
    const visual = orbit?.querySelector('.hero-orbit__visual');
    const interaction = orbit?.querySelector('.hero-orbit__interaction');
    const items = [...(orbit?.querySelectorAll('.hero-orbit__item') || [])];
    const hoverLabel = orbit?.querySelector('.hero-orbit__hover-label');
    if (visual && hoverLabel && hoverLabel.parentElement !== visual) visual.append(hoverLabel);
    const hoverLabelText = hoverLabel?.querySelector('span');
    const frontInfo = orbit?.querySelector('.hero-orbit__front-info');
    const frontInfoIndex = frontInfo?.querySelector('[data-front-index]');
    const frontInfoName = frontInfo?.querySelector('[data-front-name]');
    const frontInfoIndexText = frontInfoIndex?.querySelector('span');
    const frontInfoNameText = frontInfoName?.querySelector('span');
    const orbitTurns = [...(orbit?.querySelectorAll('[data-orbit-step]') || [])];
    const downCue = orbit?.querySelector('.hero-orbit__down-cue');
    if (!orbit || !interaction || items.length !== 5) return;
    const step = Math.PI * 2 / items.length;
    const state = { angle:0, target:0, velocity:0, lastInput:0, lastMove:performance.now(), lastFrame:performance.now(), lean:0, leanTarget:0, dragging:false, hover:-1 };
    const drag = { x:0, y:0, start:0, time:0, moved:false, down:false };
    let frame = 0;
    let introAnimations = [];
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const nearest = (angle) => ((Math.round(-angle / step) % items.length) + items.length) % items.length;
    let labelItem = -1;
    const hideHoverLabel = () => {
      hoverLabel?.classList.remove('is-visible');
      hoverLabel?.style.removeProperty('opacity');
      hoverLabel?.style.removeProperty('filter');
      hoverLabel?.style.removeProperty('z-index');
    };
    const cancelIntro = () => {
      introAnimations.forEach((animation) => animation.cancel());
      introAnimations = [];
    };
    const render = (time = performance.now()) => {
      const width = Math.max(1, orbit.clientWidth);
      const height = Math.max(1, orbit.clientHeight);
      const mobile = matchMedia('(max-width:720px)').matches;
      const radius = Math.min(width * (mobile ? .31 : .39), mobile ? 160 : 280);
      const planeY = Math.cos(72 * Math.PI / 180);
      const speedBlur = clamp(Math.abs(state.velocity) * .09, 0, .9);
      const active = nearest(state.angle + state.lean);
      items.forEach((item, index) => {
        const angle = index * step + state.angle + state.lean;
        const cosine = Math.cos(angle);
        const x = Math.sin(angle) * radius;
        const y = cosine * radius * planeY + height * .04;
        const scale = .56 + (cosine + 1) * .27;
        const opacity = .34 + (.66 * (cosine + 1) / 2);
        const depthBlur = clamp(1 - cosine, 0, 2);
        const blur = clamp(depthBlur + speedBlur, 0, 2.6);
        item.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-50%) scale(${scale.toFixed(3)})`;
        item.style.opacity = String(opacity.toFixed(3));
        item.style.filter = `blur(${blur.toFixed(2)}px) drop-shadow(0px 12px 9px color-mix(in srgb,var(--ink) 25%,transparent))`;
        // All mascots sit above the disk surface; depth remains expressed by
        // their scale, opacity, and blur rather than disk lines crossing them.
        item.style.zIndex = String(cosine < 0 ? 81 + Math.round((cosine + 1) * 2) : 85 + Math.round(cosine * 4));
        item.dataset.active = String(index === active);
        item.dataset.depth = cosine > .35 ? 'front' : cosine < -.35 ? 'back' : 'middle';
        item.setAttribute('aria-label', item.dataset.label || item.textContent.trim());
      });
      const disc = orbit.querySelector('.hero-orbit__disc');
      if (disc) disc.style.setProperty('--orbit-neon-angle', `${(-state.angle - state.lean) * 180 / Math.PI}deg`);
      const logo = orbit.querySelector('.hero-stage');
      if (logo) logo.style.zIndex = '84';
      const currentName = items[active]?.querySelector('.hero-orbit__label')?.textContent.trim() || '';
      const currentIndex = String(active + 1).padStart(2, '0');
      if (frontInfo) {
        frontInfo.href = items[active]?.getAttribute('href') || '#';
        frontInfo.setAttribute('aria-label', `前往${currentName}頁面`);
      }
      const revealInfoText = (element, value) => {
        if (!element || element.textContent === value) return false;
        element.classList.remove('is-swapping');
        element.textContent = value;
        if (!reduceMotion) {
          void element.offsetWidth;
          element.classList.add('is-swapping');
        }
        return true;
      };
      revealInfoText(frontInfoIndexText, currentIndex);
      const infoChanged = revealInfoText(frontInfoNameText, currentName);
      if (infoChanged && frontInfo) {
        frontInfo.classList.remove('is-transitioning');
        if (!reduceMotion) {
          void frontInfo.offsetWidth;
          frontInfo.classList.add('is-transitioning');
        }
      }
      const selectedItem = state.hover >= 0 ? items[state.hover] : null;
      if (!hoverLabel || !hoverLabelText || !selectedItem) {
        labelItem = -1;
        hideHoverLabel();
        return;
      }
      if (labelItem !== state.hover) {
        hoverLabelText.textContent = selectedItem.querySelector('.hero-orbit__label')?.textContent.trim() || selectedItem.getAttribute('aria-label') || '';
        labelItem = state.hover;
      }
      hoverLabel.classList.add('is-visible');
      const selectedAngle = state.hover * step + state.angle + state.lean;
      const selectedCosine = Math.cos(selectedAngle);
      const selectedScale = .56 + (selectedCosine + 1) * .27;
      const labelX = width / 2 + Math.sin(selectedAngle) * radius;
      const labelY = height / 2 + selectedCosine * radius * planeY + height * .04;
      const itemHeight = selectedItem.offsetHeight * selectedScale;
      const bubbleWidth = hoverLabel.offsetWidth || 186;
      const bubbleHeight = hoverLabelText.offsetHeight || 62;
      const safeX = clamp(labelX, bubbleWidth / 2 + 10, width - bubbleWidth / 2 - 10);
      const tailX = clamp(bubbleWidth / 2 + labelX - safeX, 18, bubbleWidth - 18);
      const aboveTop = labelY - itemHeight / 2 - bubbleHeight - 20;
      const below = aboveTop < 8;
      hoverLabel.style.left = `${safeX.toFixed(2)}px`;
      hoverLabel.style.top = `${(below ? labelY + itemHeight / 2 + 18 : labelY - itemHeight / 2 - 4).toFixed(2)}px`;
      hoverLabel.style.setProperty('--bubble-tail-x', `${tailX.toFixed(1)}px`);
      hoverLabel.classList.toggle('is-below', below);
      const itemBlur = Number(selectedItem.style.filter.match(/blur\(([\d.]+)px\)/)?.[1] || 0);
      const itemOpacity = Number(selectedItem.style.opacity || 1);
      const itemDepth = Number(selectedItem.style.zIndex || 20);
      const labelDepthBlur = clamp(itemBlur, 0, 2.6);
      hoverLabel.style.filter = `blur(${labelDepthBlur.toFixed(2)}px)`;
      hoverLabel.style.opacity = String(itemOpacity);
      hoverLabel.style.zIndex = String(itemDepth);
      hoverLabel.dataset.behindGlass = String(selectedCosine < -.02);
      hoverLabel.classList.toggle('is-behind-glass', selectedCosine < -.02);
      const sphere = orbit.querySelector('.hero-crystal');
      if (sphere) {
        const sphereRect = sphere.getBoundingClientRect();
        const bubbleRect = hoverLabel.getBoundingClientRect();
        hoverLabel.style.setProperty('--glass-x', `${(sphereRect.left + sphereRect.width / 2 - bubbleRect.left - bubbleRect.width / 2).toFixed(1)}px`);
        hoverLabel.style.setProperty('--glass-y', `${(sphereRect.top + sphereRect.height / 2 - bubbleRect.top - bubbleRect.height / 2).toFixed(1)}px`);
        hoverLabel.style.setProperty('--glass-radius', `${(Math.min(sphereRect.width, sphereRect.height) / 2).toFixed(1)}px`);
      }
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
    orbitTurns.forEach((button) => button.addEventListener('click', () => {
      cancelIntro();
      state.target += (button.dataset.orbitStep === 'previous' ? 1 : -1) * step;
      state.velocity = 0;
      state.lastInput = performance.now();
      state.lastMove = state.lastInput;
    }));
    downCue?.addEventListener('click', () => {
      document.querySelector('#home-explore')?.scrollIntoView({ behavior:reduceMotion ? 'instant' : 'smooth', block:'start' });
    });
    const pointerDown = (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      cancelIntro();
      hideHoverLabel();
      state.hover = -1;
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
      const hoveredItem = !drag.down && event.pointerType !== 'touch' ? event.target.closest?.('.hero-orbit__item') : null;
      state.hover = hoveredItem && orbit.contains(hoveredItem) ? items.indexOf(hoveredItem) : -1;
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
      }
    };
    const pointerEnd = (event) => {
      if (!drag.down) return;
      drag.down = false;
      state.dragging = false;
      interaction.classList.remove('is-grabbing');
      const hoveredItem = event?.target.closest?.('.hero-orbit__item');
      state.hover = hoveredItem && orbit.contains(hoveredItem) ? items.indexOf(hoveredItem) : -1;
      const reach = clamp(state.velocity * .20, -step, step);
      const bias = Math.abs(state.velocity) > .04 ? Math.sign(state.velocity) * .4 : 0;
      state.target = Math.round((state.target + reach) / step + bias) * step;
      state.lastInput = 0;
      if (drag.moved) window.setTimeout(() => { drag.moved = false; }, 320);
    };
    interaction.addEventListener('pointerdown', pointerDown);
    orbit.addEventListener('pointerleave', () => { state.hover = -1; hideHoverLabel(); });
    orbit.addEventListener('focusin', (event) => {
      const focusedItem = event.target.closest?.('.hero-orbit__item');
      state.hover = focusedItem ? items.indexOf(focusedItem) : -1;
    });
    orbit.addEventListener('focusout', (event) => {
      if (!orbit.contains(event.relatedTarget)) { state.hover = -1; hideHoverLabel(); }
    });
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
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) { const revealTargets = document.querySelectorAll('.section, .page-hero, .article, .booking-card, .studio-page__copy, .service-list article, .services-faq'); revealTargets.forEach((element, index) => { element.classList.add('reveal-on-scroll'); element.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`); }); const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target); } }), { threshold: .12 }); revealTargets.forEach((element) => observer.observe(element)); }
  if (currentPath === '/services' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const openingPanels = [...document.querySelectorAll('.services-page > .page-hero--service, .services-page > .services-summary')];
    let snapTimer = 0;
    if (openingPanels.length === 2) window.addEventListener('scroll', () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const anchor = openingPanels[0].getBoundingClientRect().top + window.scrollY;
        const nearest = openingPanels.map((panel) => ({ panel, distance: Math.abs(panel.getBoundingClientRect().top - anchor) })).reduce((best, panel) => panel.distance < best.distance ? panel : best);
        if (nearest.distance > window.innerHeight * .48) return;
        const target = Math.max(0, window.scrollY + nearest.panel.getBoundingClientRect().top - anchor);
        if (Math.abs(target - window.scrollY) > 24) window.scrollTo({ top:target, behavior:'smooth' });
      }, 140);
    }, { passive:true });
  }
  if (currentPath === '/services' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const openingPanels = [...document.querySelectorAll('.services-page > .page-hero--service, .services-page > .services-summary')];
    let snapTimer = 0;
    if (openingPanels.length === 2) window.addEventListener('scroll', () => {
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(() => {
        const anchor = openingPanels[0].getBoundingClientRect().top + window.scrollY;
        const nearest = openingPanels.map((panel) => ({ panel, distance: Math.abs(panel.getBoundingClientRect().top - anchor) })).reduce((best, panel) => panel.distance < best.distance ? panel : best);
        if (nearest.distance > window.innerHeight * .48) return;
        const target = Math.max(0, window.scrollY + nearest.panel.getBoundingClientRect().top - anchor);
        if (Math.abs(target - window.scrollY) > 24) window.scrollTo({ top:target, behavior:'smooth' });
      }, 140);
    }, { passive:true });
  }
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
      grid.innerHTML = items.map((item, index) => { const title = escapeHtml(item.title); const href = escapeHtml(item.href); const cover = item.cover ? `<a class="card-art-link" href="${href}" aria-label="閱讀文章：${title}"><img class="card-cover" src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.imageAlt)}" loading="lazy"></a>` : ''; const visual = cover || (item.type === 'video' ? `<button class="card-play" ${item.embed_url ? `data-youtube="${escapeHtml(item.embed_url)}"` : `data-video="${escapeHtml(item.video)}"`} aria-label="播放 ${title}">▶</button>` : `<span>${escapeHtml(item.type).toUpperCase()}</span>`); return `<article class="content-card content-card--${escapeHtml(item.accent)}" data-content-type="${escapeHtml(item.type)}" style="--card-index:${index}"><div class="card-art">${visual}<span class="card-liquid-glass" aria-hidden="true"></span></div><div class="card-meta"><span>${escapeHtml(item.tag)}</span><span>${escapeHtml(item.date)}</span></div><h3>${title}</h3><p>${escapeHtml(item.excerpt)}</p><a href="${href}">閱讀內容 <span>→</span></a></article>`; }).join('');
    };
    let cardPointerFrame = 0;
    let pendingCardPointer = null;
    grid.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const card = event.target.closest('.content-card');
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      const artBounds = card.querySelector('.card-art')?.getBoundingClientRect() || bounds;
      pendingCardPointer = {
        card,
        x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
        y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)),
        artX: Math.max(0, Math.min(100, (event.clientX - artBounds.left) / artBounds.width * 100)),
        artY: Math.max(0, Math.min(100, (event.clientY - artBounds.top) / artBounds.height * 100))
      };
      if (cardPointerFrame) return;
      cardPointerFrame = window.requestAnimationFrame(() => {
        cardPointerFrame = 0;
        if (!pendingCardPointer) return;
        const { card: activeCard, x, y, artX, artY } = pendingCardPointer;
        activeCard.style.setProperty('--card-pointer-x', `${x.toFixed(1)}%`);
        activeCard.style.setProperty('--card-pointer-y', `${y.toFixed(1)}%`);
        activeCard.style.setProperty('--card-art-pointer-x', `${artX.toFixed(1)}%`);
        activeCard.style.setProperty('--card-art-pointer-y', `${artY.toFixed(1)}%`);
        activeCard.style.setProperty('--card-tilt-x', `${((50 - y) * .035).toFixed(2)}deg`);
        activeCard.style.setProperty('--card-tilt-y', `${((x - 50) * .035).toFixed(2)}deg`);
        pendingCardPointer = null;
      });
    });
    grid.addEventListener('pointerover', (event) => {
      if (event.pointerType === 'touch') return;
      const card = event.target.closest('.content-card');
      if (card && !card.contains(event.relatedTarget)) card.classList.add('is-jelly-active');
    });
    grid.addEventListener('pointerout', (event) => {
      const card = event.target.closest('.content-card');
      if (card && !card.contains(event.relatedTarget)) {
        card.classList.remove('is-jelly-active');
        card.style.setProperty('--card-tilt-x', '0deg');
        card.style.setProperty('--card-tilt-y', '0deg');
      }
    });
    grid.addEventListener('focusin', (event) => {
      const card = event.target.closest('.content-card');
      if (card) card.classList.add('is-jelly-active');
    });
    grid.addEventListener('focusout', (event) => {
      const card = event.target.closest('.content-card');
      if (card && !card.contains(event.relatedTarget)) card.classList.remove('is-jelly-active');
    });
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
