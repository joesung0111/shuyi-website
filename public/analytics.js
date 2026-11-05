(() => {
  try {
    if (window.__SHUYI_ANALYTICS__) return;
    window.__SHUYI_ANALYTICS__ = true;
    const uuid = () => crypto.randomUUID().replaceAll('-', '');
    const get = (storage, key, create) => {
      let value = storage.getItem(key);
      if (!value && create) { value = uuid(); storage.setItem(key, value); }
      return value || '';
    };
    const visitorId = get(localStorage, 'shuyi_analytics_visitor', true);
    const sessionId = get(sessionStorage, 'shuyi_analytics_session', true);
    const details = (() => {
      const ua = navigator.userAgent.toLowerCase();
      return {
        device: /ipad|tablet|kindle|silk|playbook/.test(ua) ? 'tablet' : /mobile|iphone|ipod|android/.test(ua) ? 'mobile' : 'desktop',
        browser: /edg\//.test(ua) ? 'Edge' : /opr\//.test(ua) ? 'Opera' : /firefox\//.test(ua) ? 'Firefox' : /(?:chrome|crios)\//.test(ua) ? 'Chrome' : /safari\//.test(ua) ? 'Safari' : 'Other',
        os: /windows/.test(ua) ? 'Windows' : /iphone|ipad|ipod/.test(ua) ? 'iOS' : /android/.test(ua) ? 'Android' : /mac os|macintosh/.test(ua) ? 'macOS' : /linux/.test(ua) ? 'Linux' : 'Other'
      };
    })();
    const path = location.pathname.replace(/\/{2,}/g, '/').slice(0, 1024) || '/';
    const referrer = (() => { try { const u = new URL(document.referrer); return `${u.origin}${u.pathname}`.slice(0, 1024); } catch { return ''; } })();
    const pageviewId = uuid();
    const previousPath = sessionStorage.getItem('shuyi_analytics_previous_path') || '';
    sessionStorage.setItem('shuyi_analytics_previous_path', path);
    let activeMs = 0;
    let lastTick = Date.now();
    let idleTimer = 0;
    let idle = false;
    let lastSentSeconds = -1;
    const visible = () => document.visibilityState === 'visible' && document.hasFocus() && !idle;
    const tick = () => {
      const now = Date.now();
      if (visible()) activeMs += Math.max(0, Math.min(15000, now - lastTick));
      lastTick = now;
    };
    const payload = (items) => ({ visitorId, sessionId, path, referrer, ...details, items });
    const send = (items, beacon = false) => {
      if (!items.length) return;
      const body = JSON.stringify(payload(items));
      if (beacon && navigator.sendBeacon) {
        try { if (navigator.sendBeacon('/api/analytics/collect', new Blob([body], { type: 'application/json' }))) return; } catch {}
      }
      fetch('/api/analytics/collect', { method: 'POST', headers: { 'content-type': 'application/json' }, body, credentials: 'same-origin', keepalive: beacon }).catch(() => {});
    };
    window.shuyiAnalytics = { track: (name, target = '') => { if (/^[a-z][a-z0-9_]{1,47}$/.test(name)) send([{ type: 'event', pageviewId, name, target }]); } };
    send([{ type: 'pageview', id: pageviewId, path, referrer, previousPath, ...details }]);
    const flushDuration = (beacon = false) => {
      tick();
      const seconds = Math.floor(activeMs / 1000);
      if (seconds > lastSentSeconds) { lastSentSeconds = seconds; send([{ type: 'duration', id: pageviewId, seconds }], beacon); }
    };
    const wake = () => {
      tick(); idle = false; clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { tick(); idle = true; }, 60000);
    };
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((event) => addEventListener(event, wake, { passive: true }));
    document.addEventListener('visibilitychange', () => { tick(); if (document.visibilityState === 'hidden') flushDuration(true); });
    addEventListener('focus', wake);
    addEventListener('blur', () => { tick(); flushDuration(true); });
    addEventListener('pagehide', () => flushDuration(true));
    setInterval(() => flushDuration(false), 15000);
    idleTimer = setTimeout(() => { tick(); idle = true; }, 60000);
    document.addEventListener('click', (event) => {
      const element = event.target.closest('a,button,[data-analytics-event]');
      if (!element) return;
      const target = element.getAttribute('data-analytics-target') || (element instanceof HTMLAnchorElement && new URL(element.href).origin !== location.origin ? 'external_link' : element.id || element.getAttribute('aria-label') || '');
      const names = new Set([element.dataset.analyticsEvent || '']);
      if (element instanceof HTMLAnchorElement && /^(?:https?:\/\/(?:line\.me|lin\.ee)(?:[/:]|$)|line:)/i.test(element.href)) names.add('line_click');
      if (element.hasAttribute('data-youtube')) names.add('video_open');
      if (element.hasAttribute('data-booking-cta') || (element instanceof HTMLAnchorElement && element.origin === location.origin && element.pathname.replace(/\/$/, '') === '/booking')) names.add('booking_cta_click');
      if (element.hasAttribute('data-booking-platform-outbound')) names.add('booking_platform_outbound');
      if (element.hasAttribute('data-journal-to-service')) names.add('journal_to_service');
      if (element.hasAttribute('data-journal-to-booking')) names.add('journal_to_booking');
      send([...names].filter((name) => /^[a-z][a-z0-9_]{1,47}$/.test(name)).map((name) => ({ type: 'event', pageviewId, name, target })), true);
    }, { passive: true });
    const played = new WeakSet();
    document.addEventListener('playing', (event) => {
      const video = event.target;
      if (!(video instanceof HTMLVideoElement) || video.autoplay || video.classList.contains('booking-demo__video') || played.has(video)) return;
      played.add(video);
      window.shuyiAnalytics.track('video_play', video.id || 'content_video');
    }, true);
    document.addEventListener('ended', (event) => {
      const video = event.target;
      if (video instanceof HTMLVideoElement && played.has(video)) { window.shuyiAnalytics.track('video_complete', video.id || 'content_video'); played.delete(video); }
    }, true);
  } catch { /* Analytics is optional and must never affect page behavior. */ }
})();
