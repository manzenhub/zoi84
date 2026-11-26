/* ZOI'84 3D ikonica – rotira se dok se skrola (Three.js r128) */
(function () {
  var el = document.getElementById('zoi3d');
  if (!el || !window.THREE) return;
  var MJERA = parseFloat(el.getAttribute('data-scale')) || 1, BRZINA = parseFloat(el.getAttribute('data-speed')) || 1, KUT = el.getAttribute('data-pos'), RUCNO = !el.hasAttribute('data-nodrag');
  var BOJA = el.getAttribute('data-color') || '#FD5E2C', DEBLJINA = 95, ZAOBLJENOST = 2, SVJETLO = 0.8; // efekt: standard
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
  var CX = 540, CY = 960;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  el.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, 1, 1, 10000);

  var pmrem = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), new THREE.MeshBasicMaterial({ color: 0x5a5a5a, side: THREE.BackSide })));
  [[0,4.6,0,6,6,0xffffff],[4.6,1,2,3,4,0xffffff],[-4.6,0,-1,2,5,0xd8d8d8],[0,0,4.6,4,1.5,0xffffff]].forEach(function (p) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(p[3], p[4]), new THREE.MeshBasicMaterial({ color: p[5], side: THREE.DoubleSide }));
    m.position.set(p[0], p[1], p[2]); m.lookAt(0, 0, 0); env.add(m);
  });
  scene.environment = pmrem.fromScene(env, 0.04).texture;

  var hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.55 * SVJETLO);
  var key = new THREE.DirectionalLight(0xffffff, 0.85 * SVJETLO); key.position.set(500, 700, 1500);
  var rim = new THREE.DirectionalLight(0xffffff, 0.35 * SVJETLO); rim.position.set(-800, -400, -600);
  scene.add(hemi, key, rim);

  var mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(BOJA), roughness: 0.4, metalness: 0.1, envMapIntensity: 0.4 });
  var grupa = new THREE.Group(); scene.add(grupa);
  OBLICI.forEach(function (t) {
    var s = new THREE.Shape();
    t.forEach(function (p, i) { var x = p[0] - CX, y = -(p[1] - CY); i ? s.lineTo(x, y) : s.moveTo(x, y); });
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: DEBLJINA, bevelEnabled: ZAOBLJENOST > 0, bevelThickness: ZAOBLJENOST * 1.3, bevelSize: ZAOBLJENOST, bevelSegments: 4, curveSegments: 1 });
    g.translate(0, 0, -DEBLJINA / 2);
    grupa.add(new THREE.Mesh(g, mat));
  });

  function resize() {
    var w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // ikonica zauzima ~94% manje dimenzije sekcije
    var t = Math.tan(THREE.MathUtils.degToRad(20));
    var dist = 400 / t;
    if (w < h) dist = dist * h / w;
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
    if (KUT) { var vh = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), vw = vh * camera.aspect; grupa.position.set(KUT.indexOf('l') > -1 ? -vw / 2 : vw / 2, KUT.indexOf('t') > -1 ? vh / 2 : -vh / 2, 0); }
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else addEventListener('resize', resize);

  // Rotacija prema skrolu: puni okret dok sekcija prolazi kroz ekran
  var sekcija = el.closest('section') || el.parentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ciljY = 0, ciljX = 0, rotY = 0, rotX = 0, vidljivo = true, ciljS = 1, sk = 1;
  function napredak() {
    var r = sekcija.getBoundingClientRect(), vh = innerHeight;
    var p = (vh - r.top) / (vh + r.height); // 0 → 1
    p = Math.max(0, Math.min(1, p));
    // vrlo sporo: ukupno ~120° dok sekcija prolazi kroz ekran, bez naginjanja
    ciljY = reduce ? 0 : (0.5 - p) * Math.PI * BRZINA; // 90° sa strane → sprijeda na sredini → -90°
    ciljX = 0;
    // povećava se dok se skrola: 70% na ulasku sekcije → 120% na izlasku
    ciljS = reduce ? 1 : 0.7 + p * 0.5;
  }
  addEventListener('scroll', napredak, { passive: true });
  napredak(); rotY = ciljY; rotX = ciljX; sk = ciljS;
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { vidljivo = e[0].isIntersecting; }).observe(el);

  // Rotacija mišem / prstom (povlačenje); okomiti nagib se vrati u balans kad se pusti
  var drag = false, lx = 0, ly = 0, dodY = 0, dodX = 0, velY = 0, velX = 0;
  var c = renderer.domElement;
  if (RUCNO) c.addEventListener('pointerdown', function (e) {
    drag = true; lx = e.clientX; ly = e.clientY; velX = velY = 0;
    el.classList.add('drag');
    if (e.pointerType === 'mouse') c.setPointerCapture(e.pointerId);
  });
  c.addEventListener('pointermove', function (e) {
    if (!drag) return;
    velY = (e.clientX - lx) * 0.008; velX = (e.clientY - ly) * 0.008;
    if (e.pointerType !== 'mouse') velX = 0; // na mobitelu okomito povlačenje skrola stranicu
    dodY += velY; dodX = Math.max(-1, Math.min(1, dodX + velX));
    lx = e.clientX; ly = e.clientY;
  });
  function pusti() { drag = false; el.classList.remove('drag'); }
  c.addEventListener('pointerup', pusti);
  c.addEventListener('pointercancel', pusti);

  (function petlja() {
    requestAnimationFrame(petlja);
    if (!vidljivo) return;
    if (!drag) {
      dodY += velY; dodX += velX; velY *= 0.93; velX *= 0.93;
      dodX += (0 - dodX) * 0.06;
    }
    rotY += (ciljY + dodY - rotY) * (drag ? 0.3 : 0.05);
    rotX += (dodX - rotX) * 0.3;
    sk += (ciljS - sk) * 0.05;
    grupa.scale.setScalar(sk * MJERA);
    grupa.rotation.set(rotX, rotY, 0);
    renderer.render(scene, camera);
  })();
})();
