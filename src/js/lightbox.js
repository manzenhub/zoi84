/* lightbox za novosti i kapitalna ulaganja: naslov, paragraf, X */
(function () {
  var EN = document.documentElement.lang === 'en';
  var X = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var lb = document.createElement('div'); lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.hidden = true;
  lb.innerHTML = '<div class="lbp"><button class="lbx" type="button" aria-label="' + (EN ? 'Close' : 'Zatvori') + '">' + X + '</button><div class="lbs"><div class="lbm"></div><h3 class="lbh"></h3><div class="lbt"></div><div class="lbd"></div></div></div>';
  document.body.appendChild(lb);
  var last = null;
  var EXTRA = { ki: [], nc: [] };
  function close() { lb.classList.remove('on'); document.body.style.overflow = ''; document.documentElement.style.overflow = ''; setTimeout(function () { if (!lb.classList.contains('on')) lb.hidden = true; }, 400); if (last) last.focus(); }
  function open(card) {
    last = card;
    if (card.hasAttribute('data-lb')) { var src = card.closest('[data-card]'); return openCard(card, src); }
    lb.querySelector('.lbd').innerHTML = '';
    var m = card.querySelector('.meta'), tag = m && m.querySelector('span');
    var rest = m ? m.textContent.replace(tag ? tag.textContent : '', '').trim() : '';
    lb.querySelector('.lbm').innerHTML = (tag ? '<span>' + tag.textContent + '</span>' : '') + rest;
    lb.querySelector('.lbh').textContent = (card.querySelector('h3') || {}).textContent || '';
    var ps = (card.dataset.p || '').split('||').filter(Boolean);
    var dd = (card.dataset.docs || '').split('||').filter(Boolean);
    lb.querySelector('.lbd').innerHTML = dd.length ? '<h4>' + (EN ? 'Documents' : 'Prilozi') + '</h4>' + dd.map(function (x) { var q = x.split('::'); return '<a href="' + q[1] + '" target="_blank" rel="noopener" data-dl><span>' + q[0] + '</span><em>' + (q[2] || '') + '</em></a>'; }).join('') : '';
    lb.querySelector('.lbt').innerHTML = ''; ps.forEach(function (t) { var p = document.createElement('p'); p.textContent = t; lb.querySelector('.lbt').appendChild(p); });
    lb.scrollTop = 0;
    lb.hidden = false; document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(function () { lb.classList.add('on'); lb.querySelector('.lbx').focus(); });
  }
  function openCard(btn, src) {
    var st = src.querySelector('.st'), ty = src.querySelector('.ty'), rok = src.querySelector('.ntr b');
    lb.querySelector('.lbm').innerHTML = (st ? '<span class="lbs-st' + (src.classList.contains('open') ? ' on' : '') + '">' + st.textContent + '</span>' : '') + (ty ? ty.textContent : '') + (rok ? ' · Rok ' + rok.textContent : '');
    lb.querySelector('.lbh').textContent = (src.querySelector('h3') || {}).textContent || '';
    var t = lb.querySelector('.lbt'); t.innerHTML = '';
    (src.dataset.p || '').split('||').forEach(function (x) { if (!x) return; var p = document.createElement('p'); p.textContent = x; t.appendChild(p); });
    var d = lb.querySelector('.lbd'), docs = src.querySelectorAll('.ntdocs a');
    d.innerHTML = docs.length ? '<h4>' + (EN ? 'Documents' : 'Dokumentacija') + '</h4>' : '';
    docs.forEach(function (a) { var c = a.cloneNode(true); if (c.getAttribute('href') === '#') c.addEventListener('click', function (e) { e.preventDefault(); }); d.appendChild(c); });
    lb.hidden = false; document.body.style.overflow = 'hidden'; document.documentElement.style.overflow = 'hidden'; lb.scrollTop = 0;
    requestAnimationFrame(function () { lb.classList.add('on'); lb.querySelector('.lbx').focus(); });
  }
  document.addEventListener('click', function (e) { var c = e.target.closest && e.target.closest('a.nc, a.ki, a[data-lb]'); if (!c) return; e.preventDefault(); open(c); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lbx')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('on')) close(); });
})();
