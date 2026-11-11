(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElement('div');
  progress.className = 'atelier-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  let frame = 0;
  function updateProgress() {
    frame = 0;
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, scrollY / distance) : 0})`;
  }
  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(updateProgress); }, { passive: true });
  addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
  if (!reduce.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('atelier-enter');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    document.querySelectorAll('.content-card,.offering-group,.services-facts > div,.booking-guide__steps li,.info-row,.article-evidence,.article-related').forEach(item => observer.observe(item));
  }
  // Small perspective response; links and native scrolling remain available.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce.matches) {
    document.querySelectorAll('.hero-main-art,.service-hero-art,.booking-character').forEach(art => {
      art.addEventListener('pointermove', event => {
        const rect = art.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        art.style.transform = `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
      });
      art.addEventListener('pointerleave', () => { art.style.transform = ''; });
      art.style.transition = 'transform .35s ease';
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      document.body.classList.remove('menu-open');
      document.querySelector('.menu-button')?.setAttribute('aria-expanded', 'false');
    }
  });
})();
