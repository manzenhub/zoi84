/* prijelaz između stranica: sadržaj menija nestane u čistu narandžastu, nova stranica se u međuvremenu asinkrono učita, pa se prikaže bez bljeska */
(function () {
  var html = document.documentElement;
  // narandžasta pozadina dok traje preloader (sprečava bijeli bljesak), vrati se kad preloader nestane
  function clearBg() { if (!document.getElementById('intro')) { html.style.background = ''; return true; } }
  if (!clearBg()) { var mo = new MutationObserver(function () { if (clearBg()) mo.disconnect(); }); mo.observe(document.body, { childList: true }); }

  var cache = {};
  function load(href) { if (!cache[href]) cache[href] = fetch(href, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.text() : null; }).catch(function () { return null; }); return cache[href]; }
  function internal(a) { if (!a || a.target === '_blank' || a.hasAttribute('download')) return null; var u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname === location.pathname) return null; return u; }
  // unaprijed učitaj stranicu čim miš pređe preko linka
  document.addEventListener('pointerover', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (internal(a)) load(a.href); }, { passive: true });

  var nav = document.getElementById('nav'), mb = document.getElementById('mb');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function go(href) { html.style.background = '#FF5F25'; location.href = href; }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var inNav = nav && a.closest('#nav') && nav.classList.contains('open');
    var u = internal(a);
    if (!inNav) { if (u) { e.preventDefault(); var t0 = performance.now(); Promise.race([load(a.href), new Promise(function (r) { setTimeout(r, 1500); })]).then(function () { go(a.href); }); } return; }
    if (reduce || nav.classList.contains('leave')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (u) load(a.href);
    nav.classList.add('leave'); document.body.classList.add('navleave');
    var faded = new Promise(function (r) { setTimeout(r, 600); });
    if (u) { Promise.all([faded, Promise.race([load(a.href), new Promise(function (r) { setTimeout(r, 2500); })])]).then(function () { go(a.href); }); return; }
    faded.then(function () {
      mb.click();
      var url = new URL(a.href, location.href), t = url.hash && url.hash !== '#top' ? document.querySelector(url.hash) : null;
      if (t) t.scrollIntoView(); else scrollTo(0, 0);
      setTimeout(function () { nav.classList.remove('leave'); document.body.classList.remove('navleave'); }, 750);
    });
  }, true);
  // povratak preko "nazad" iz keša preglednika: skloni stanje izlaska
  addEventListener('pageshow', function (e) { if (e.persisted && nav) { nav.classList.remove('leave'); document.body.classList.remove('navleave'); html.style.background = ''; if (nav.classList.contains('open')) mb.click(); } });
})();
