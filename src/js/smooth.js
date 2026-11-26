/* smooth scroll (Lenis) za cijeli web; isključen uz "smanji pokrete" i na dodir (mobitel ima svoj prirodni skrol) */
(function () {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var css = 'html.lenis,html.lenis body{height:auto}.lenis:not(.lenis-autoToggle).lenis-stopped{overflow:clip}.lenis [data-lenis-prevent],.lenis [data-lenis-prevent-wheel]{overscroll-behavior:contain}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-smooth iframe{pointer-events:none}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: { offset: 0 }, autoRaf: true });
  window.lenis = lenis;
  // meni, lightbox i preloader zaključavaju skrol preko overflow:hidden – tada zaustavi i Lenis
  var html = document.documentElement, body = document.body;
  function sync() {
    var locked = body.style.overflow === 'hidden' || html.style.overflow === 'hidden' || body.classList.contains('intro');
    if (locked && !lenis.isStopped) lenis.stop(); else if (!locked && lenis.isStopped) lenis.start();
  }
  new MutationObserver(sync).observe(body, { attributes: true, attributeFilter: ['style', 'class'] });
  new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['style'] });
  sync();
  // elementi s vlastitim skrolom (lightbox, meni) skrolaju normalno
  function prevent() { document.querySelectorAll('.lb, #nav').forEach(function (el) { el.setAttribute('data-lenis-prevent', ''); }); }
  prevent(); new MutationObserver(prevent).observe(body, { childList: true });
})();
