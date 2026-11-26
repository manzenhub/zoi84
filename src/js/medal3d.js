/* 3D srebrna medalja Sarajevo 1984 – ponaša se kao logo i baklja (rotacija i rast na skrol, povlačenje mišem) */
(function () {
  var el = document.getElementById('medal3d');
  if (!el || !window.THREE) return;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  el.appendChild(renderer.domElement);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  if (THREE.RoomEnvironment) { var pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture; }
  var key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2, 3, 4);
  var rim = new THREE.DirectionalLight(0xfff0e0, 0.8); rim.position.set(-3, 1, -2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a3a20, 0.5), key, rim);
  var grupa = new THREE.Group(); scene.add(grupa); var VEL = 0.84;

  // --- reljef diska (tekst, krugovi, amblem) iscrtan na canvas ---
  var OBLICI = [
    [[330.27,633.52],[330.27,726.87],[437.43,834.07],[637.95,834.07],[746.86,725.14],[746.86,632.71],[609.49,757.12],[466.06,757.12]],
    [[465.07,588.57],[610.31,588.57],[610.31,733.82],[465.07,733.82]],
    [[216.90,1167.22],[310.25,1167.22],[417.45,1060.03],[417.45,859.51],[308.53,750.62],[216.06,750.62],[340.50,887.96],[340.50,1031.43]],
    [[171.96,887.18],[317.20,887.18],[317.20,1032.38],[171.96,1032.38]],
    [[744.51,1286.48],[744.51,1193.14],[637.30,1085.97],[436.82,1085.97],[327.93,1194.86],[327.93,1287.32],[465.25,1162.89],[608.79,1162.89]],
    [[464.46,1186.22],[609.67,1186.22],[609.67,1331.43],[464.46,1331.43]],
    [[863.09,755.93],[769.75,755.93],[662.54,863.10],[662.54,1063.62],[771.46,1172.54],[863.97,1172.54],[739.50,1035.20],[739.50,891.69]],
    [[762.80,890.77],[908.04,890.77],[908.04,1035.97],[762.80,1035.97]]
  ];
  function relief(base, ink) {
    var S = 1024, c = document.createElement('canvas'); c.width = c.height = S; var g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, S, S);
    g.fillStyle = ink; g.strokeStyle = ink;
    // žig prema originalu
    g.textAlign = 'center'; g.textBaseline = 'middle';
    function arc(text, R, a0, a1, bottom, px) {
      g.font = '500 ' + px + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
      var ws = [], tot = 0, sp = px * 0.06;
      for (var i = 0; i < text.length; i++) { var w = g.measureText(text[i]).width + sp; ws.push(w); tot += w; }
      var span = a1 - a0, acc = 0;
      for (var j = 0; j < text.length; j++) {
        var a = a0 + span * (acc + ws[j] / 2) / tot; acc += ws[j];
        g.save(); g.translate(S / 2 + Math.cos(a) * R, S / 2 + Math.sin(a) * R);
        g.rotate(bottom ? a - Math.PI / 2 : a + Math.PI / 2); g.fillText(text[j], 0, 0); g.restore();
      }
    }
    var D2R = Math.PI / 180;
    arc('XIV ZIMSKE OLIMPIJSKE IGRE', 400, 157 * D2R, 376 * D2R, false, 74);
    arc('SARAJEVO 1984', 405, 140 * D2R, 38 * D2R, true, 76);
    g.lineWidth = 11; var rr = 50, sx = 112, cy = 318;
    [[-1, 0], [0, 0], [1, 0], [-0.5, 1], [0.5, 1]].forEach(function (p) { g.beginPath(); g.arc(S / 2 + p[0] * sx, cy + p[1] * 48, rr, 0, Math.PI * 2); g.stroke(); });
    g.save(); g.translate(S / 2, 650); var k = 0.5; g.scale(k, k); g.translate(-540, -960);
    OBLICI.forEach(function (sh) { g.beginPath(); sh.forEach(function (p, j) { j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }); g.closePath(); g.fill(); });
    g.restore();
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t;
  }
  var mapTex = relief('#8f9297', '#e4e6e9');
  var bumpTex = relief('#3a3a3a', '#ffffff'); bumpTex.encoding = THREE.LinearEncoding;

  var silver = new THREE.MeshStandardMaterial({ color: new THREE.Color('#b9bcc1').convertSRGBToLinear(), metalness: 1, roughness: 0.22 });
  var discMat = new THREE.MeshStandardMaterial({ map: mapTex, bumpMap: bumpTex, bumpScale: 0.02, metalness: 0.85, roughness: 0.4 });

  // --- ploča medalje (zaobljeni trapez) ---
  // točan obris prema predlošku (normalizirano: širina ~1, visina 1)
  var s = new THREE.Shape();
  s.moveTo(-0.314, 0.5);
  s.lineTo(0.316, 0.5);
  s.quadraticCurveTo(0.478, 0.485, 0.498, 0.328);
  s.lineTo(0.476, 0.0);
  s.lineTo(0.484, -0.155);
  s.lineTo(0.398, -0.474);
  s.quadraticCurveTo(0.388, -0.5, 0.355, -0.5);
  s.lineTo(-0.360, -0.5);
  s.quadraticCurveTo(-0.392, -0.498, -0.398, -0.480);
  s.lineTo(-0.486, -0.147);
  s.lineTo(-0.478, 0.0);
  s.lineTo(-0.498, 0.328);
  s.quadraticCurveTo(-0.490, 0.482, -0.314, 0.5);
  var D = 0.035, CX = 0, CY = 0.06, RD = 0.33;
  // gusta mreža da se površina može glatko 'kovati'
  var B = s.getSpacedPoints(360); B.pop();
  var area = 0; for (var i = 0; i < B.length; i++) { var a1 = B[i], b1 = B[(i + 1) % B.length]; area += a1.x * b1.y - b1.x * a1.y; }
  var orient = area > 0 ? 1 : -1;
  function inward(i, inset) { var p0 = B[(i - 1 + B.length) % B.length], p1 = B[(i + 1) % B.length], tx = p1.x - p0.x, ty = p1.y - p0.y, l = Math.hypot(tx, ty) || 1;
    return [B[i].x - ty / l * inset * orient, B[i].y + tx / l * inset * orient]; }
  function warp(x, y) { var d = Math.hypot(x - CX, y - CY), m = Math.min(1, Math.max(0, (d - RD - 0.03) / 0.14)); m = m * m * (3 - 2 * m);
    return m * (0.016 * Math.sin(3.1 * x + 0.7) * Math.sin(2.6 * y + 1.3) + 0.008 * Math.sin(7 * x - 4 * y + 0.5)); }
  function thick(x, y) { var d = Math.hypot(x - CX, y - CY), m = Math.min(1, Math.max(0, (d - RD - 0.03) / 0.14)); return m * 0.006 * Math.sin(9 * x + 5 * y); }
  var IN = 0.016, BI = B.map(function (_, i) { return inward(i, IN); });
  function inside(x, y) { var c = false; for (var i = 0, j = BI.length - 1; i < BI.length; j = i++) { var xi = BI[i][0], yi = BI[i][1], xj = BI[j][0], yj = BI[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
  function nearest(x, y) { var best = 1e9, bx = x, by = y; for (var i = 0; i < BI.length; i++) { var a2 = BI[i], b2 = BI[(i + 1) % BI.length], dx = b2[0] - a2[0], dy = b2[1] - a2[1];
    var t = Math.max(0, Math.min(1, ((x - a2[0]) * dx + (y - a2[1]) * dy) / (dx * dx + dy * dy))), px = a2[0] + t * dx, py = a2[1] + t * dy, dd = (px - x) * (px - x) + (py - y) * (py - y);
    if (dd < best) { best = dd; bx = px; by = py; } } return [bx, by]; }
  var N = 150, X0 = -0.56, X1 = 0.56, Y0 = -0.62, Y1 = 0.55, gx = [], gy = [], gin = [];
  for (var r = 0; r <= N; r++) for (var c2 = 0; c2 <= N; c2++) { var x = X0 + (X1 - X0) * c2 / N, y = Y0 + (Y1 - Y0) * r / N, ins = inside(x, y);
    if (!ins) { var q = nearest(x, y); x = q[0]; y = q[1]; } gx.push(x); gy.push(y); gin.push(ins); }
  var pos = [], idx = [], used = {};
  function vid(k, side) { var key = k + '_' + side; if (used[key] !== undefined) return used[key];
    var x = gx[k], y = gy[k], z = warp(x, y) + side * (D / 2 + 0.01 + (side > 0 ? thick(x, y) : 0)); pos.push(x, y, z); return used[key] = pos.length / 3 - 1; }
  for (var r2 = 0; r2 < N; r2++) for (var c3 = 0; c3 < N; c3++) { var k0 = r2 * (N + 1) + c3, k1 = k0 + 1, k2 = k0 + N + 1, k3 = k2 + 1;
    if (!(gin[k0] || gin[k1] || gin[k2] || gin[k3])) continue;
    [1, -1].forEach(function (sd) { var A = vid(k0, sd), Bv = vid(k1, sd), C = vid(k2, sd), Dv = vid(k3, sd);
      if (sd > 0) idx.push(A, Bv, Dv, A, Dv, C); else idx.push(A, Dv, Bv, A, C, Dv); }); }
  // rub: 4 prstena za zaobljenu ivicu
  var rings = [[IN, D / 2 + 0.01], [0.004, D / 2 - 0.002], [0.004, -D / 2 + 0.002], [IN, -D / 2 - 0.01]], base0 = pos.length / 3, M = B.length;
  rings.forEach(function (rg0) { for (var i = 0; i < M; i++) { var q = inward(i, rg0[0]), x = q[0], y = q[1];
    pos.push(x, y, warp(x, y) + rg0[1] + (rg0[1] > 0 && rg0[0] === IN ? thick(x, y) : 0)); } });
  for (var rr2 = 0; rr2 < 3; rr2++) for (var i = 0; i < M; i++) { var a3 = base0 + rr2 * M + i, b3 = base0 + rr2 * M + (i + 1) % M, c4 = a3 + M, d4 = b3 + M;
    if (orient > 0) idx.push(a3, c4, b3, b3, c4, d4); else idx.push(a3, b3, c4, b3, d4, c4); }
  var pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setIndex(idx); pg.computeVertexNormals();
  var plate = new THREE.Mesh(pg, silver); grupa.add(plate);
  [1, -1].forEach(function (side) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(RD + 0.012, 0.012, 16, 96), silver);
    ring.position.set(CX, CY, side * (D / 2 + 0.02)); grupa.add(ring);
    var disc = new THREE.Mesh(new THREE.CircleGeometry(RD, 96), discMat);
    disc.position.set(CX, CY, side * (D / 2 + 0.016)); if (side < 0) disc.rotation.y = Math.PI; grupa.add(disc);
  });
  var mark = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.005), silver); mark.position.set(0, -0.40, warp(0,-0.40) + D / 2 + 0.014); grupa.add(mark);

  function resize() {
    var w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    var halfH = Math.max(0.62, 0.62 / camera.aspect);
    var dist = halfH / Math.tan(THREE.MathUtils.degToRad(15));
    camera.position.set(0, 0, dist); camera.updateProjectionMatrix();
    // medalja na dnu platna, vrpca ide do vrha
    VEL = innerWidth <= 900 ? 1.11 : 0.852; grupa.position.y = -halfH + VEL * 0.5 * 1.06 + 0.02;
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else addEventListener('resize', resize);

  var sekcija = el.closest('section') || el.parentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ciljY = 0, rotY = 0, rotX = 0, vidljivo = true, ciljS = 1, sk = 1;
  function napredak() { var r = sekcija.getBoundingClientRect(), vh = innerHeight; var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
    ciljY = reduce ? 0 : (0.5 - p) * Math.PI; ciljS = reduce ? 1 : 0.88 + p * 0.17; }
  addEventListener('scroll', napredak, { passive: true }); napredak(); rotY = ciljY; sk = ciljS;
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { vidljivo = e[0].isIntersecting; }).observe(el);
  var drag = false, lx = 0, ly = 0, dodY = 0, dodX = 0, velY = 0, velX = 0, cv = renderer.domElement;
  cv.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; velX = velY = 0; el.classList.add('drag'); if (e.pointerType === 'mouse') cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) { if (!drag) return; velY = (e.clientX - lx) * 0.008; velX = (e.clientY - ly) * 0.008; if (e.pointerType !== 'mouse') velX = 0;
    dodY += velY; dodX = Math.max(-1, Math.min(1, dodX + velX)); lx = e.clientX; ly = e.clientY; });
  function pusti() { drag = false; el.classList.remove('drag'); }
  cv.addEventListener('pointerup', pusti); cv.addEventListener('pointercancel', pusti);
  (function petlja() {
    requestAnimationFrame(petlja); if (!vidljivo) return;
    if (!drag) { dodY += velY; dodX += velX; velY *= 0.93; velX *= 0.93; dodX += (0 - dodX) * 0.06; }
    // samo prednja strana: ukupni zakret ograničen na ±85°, a ručni dodatak se ne gomila preko granice
    var LIM = 1.48; dodY = Math.max(-LIM - ciljY, Math.min(LIM - ciljY, dodY)); if (Math.abs(ciljY + dodY) >= LIM) velY = 0;
    rotY += (Math.max(-LIM, Math.min(LIM, ciljY + dodY)) - rotY) * (drag ? 0.3 : 0.05); rotX += (dodX - rotX) * 0.3; sk += (ciljS - sk) * 0.05;
    grupa.scale.setScalar(sk * VEL); grupa.rotation.set(rotX, rotY, 0);
    renderer.render(scene, camera);
  })();
})();
