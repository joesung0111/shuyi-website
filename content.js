const SHU_YI_FALLBACK_CONTENT = [
  { type: 'article', tag: 'BODY NOTE', date: 'DRAFT', title: '久坐後的緊繃感，從哪裡開始聽？', excerpt: '一段給日常身體感受的小筆記。', accent: 'peach', href: './activate-after-sitting/' },
  { type: 'video', tag: 'SHU YI FILM', date: '01:02', title: '舒逸的第一個呼吸練習', excerpt: '跟著影片，留一分鐘給自己。', video: '../素材/單純動畫-02.mp4', accent: 'violet', href: './first-breath/' },
  { type: 'news', tag: 'STUDIO NEWS', date: 'DRAFT', title: '舒逸工作室，正在慢慢成形', excerpt: '新空間、新服務與我們想分享的事。', accent: 'lime', href: './studio-in-progress/' }
];
window.SHU_YI_CONTENT = SHU_YI_FALLBACK_CONTENT;
window.SHU_YI_CONTENT_READY = fetch('/api/content?status=published').then((response) => response.ok ? response.json() : Promise.reject()).then((items) => { window.SHU_YI_CONTENT = items; document.dispatchEvent(new CustomEvent('shuyi-content-ready')); }).catch(() => undefined);
