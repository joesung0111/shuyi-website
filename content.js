// Preserve the server-rendered published list until a valid response is ready.
window.SHU_YI_CONTENT_READY = fetch('/api/content?status=published')
  .then(response => response.ok ? response.json() : Promise.reject(new Error('Content unavailable')))
  .then(items => {
    if (!Array.isArray(items) || items.some(item => item.status !== 'published')) throw new Error('Invalid public content');
    window.SHU_YI_CONTENT = items;
    document.dispatchEvent(new CustomEvent('shuyi-content-ready'));
  })
  .catch(() => undefined);
