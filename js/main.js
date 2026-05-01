(function() {
  'use strict';

  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const body = document.body;

  // ── Header scroll state ──
  function updateHeaderState() {
    if (!header) return;
    const scrolled = window.scrollY > 32;
    header.classList.toggle('is-scrolled', scrolled);
  }

  // ── Hero detection (for transparent header on dark hero) ──
  const heroEl = document.querySelector('.hero, .training-hero');
  if (heroEl && header) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          header.classList.toggle('on-hero', entry.isIntersecting);
        });
      },
      { rootMargin: `-${getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '72px'} 0px 0px 0px` }
    );
    heroObserver.observe(heroEl);
  } else if (header) {
    header.classList.add('has-solid-bg');
  }

  // ── Mobile nav toggle ──
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = body.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', isOpen);
      body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-drawer__link').forEach(link => {
      link.addEventListener('click', () => {
        body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) {
        body.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
        body.style.overflow = '';
      }
    });
  }

  window.addEventListener('scroll', updateHeaderState, { passive: true });
  updateHeaderState();
})();
