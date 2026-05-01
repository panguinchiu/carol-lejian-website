(function() {
  'use strict';

  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  // Close other open items when one opens (one-at-a-time behavior)
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        items.forEach(other => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  // Open via URL hash, e.g. /faq.html#q1
  if (location.hash) {
    const target = document.querySelector(location.hash + '.faq-item, ' + location.hash + ' .faq-item');
    const direct = location.hash && document.getElementById(location.hash.slice(1));
    if (direct && direct.classList.contains('faq-item')) {
      direct.open = true;
      setTimeout(() => direct.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  }
})();
