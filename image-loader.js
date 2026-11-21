(() => {
  'use strict';
  const selector = 'img[data-pyq-image]';
  const states = new WeakMap();
  document.documentElement.classList.add('pyq-images-enabled');

  function setState(img, state) {
    const wrapper = img.closest('.pyq-image');
    if (!wrapper) return;
    states.set(img, state);
    wrapper.classList.toggle('pyq-image--pending', state === 'pending');
    wrapper.classList.toggle('pyq-image--error', state === 'error');
    wrapper.setAttribute('aria-busy', String(state === 'pending'));
    const text = wrapper.querySelector('.pyq-image-message');
    if (text) text.textContent = state === 'error' ? 'Image could not load.' : 'Loading image…';
  }

  function initialize(img) {
    if (states.has(img)) return;
    img.decoding = 'async';
    img.loading = 'lazy';
    img.addEventListener('load', () => setState(img, 'loaded'));
    img.addEventListener('error', () => setState(img, 'error'));
    setState(img, img.complete ? (img.naturalWidth ? 'loaded' : 'error') : 'pending');
    const retry = img.closest('.pyq-image')?.querySelector('.pyq-image-retry');
    retry?.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      setState(img, 'pending');
      const source = new URL(img.getAttribute('src'), document.baseURI);
      source.searchParams.set('pyq_retry', String(Date.now()));
      img.src = source.href;
    });
  }

  document.querySelectorAll(selector).forEach(initialize);
  // Keep the same behavior when filters or future features insert new questions.
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches(selector)) initialize(node);
        node.querySelectorAll(selector).forEach(initialize);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  function preparePrint() {
    const visibleImages = Array.from(document.querySelectorAll(selector)).filter(img => !img.closest('[hidden]'));
    for (const img of visibleImages) img.loading = 'eager';
    return Promise.all(visibleImages.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        const finish = () => { clearTimeout(timer); resolve(); };
        const timer = setTimeout(finish, 15000);
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      });
    }));
  }
  window.addEventListener('beforeprint', preparePrint);
  // The reader's own click handler calls print immediately; wait for diagrams first.
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-print]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.dataset.pyqPrinting) return;
    button.dataset.pyqPrinting = 'true';
    const label = button.textContent;
    button.textContent = 'Preparing images…';
    button.disabled = true;
    try { await preparePrint(); window.print(); }
    finally { button.textContent = label; button.disabled = false; delete button.dataset.pyqPrinting; }
  }, true);
})();
