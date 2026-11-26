/* 3D olimpijska baklja – ponaša se isto kao ZOI'84 logo (rotacija i povećanje na skrol, povlačenje mišem/prstom) */
(function () {
  var el = document.getElementById('torch3d');
  if (!el || !window.THREE || !THREE.GLTFLoader || !window.BAKLJA_GLB) return;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';
  el.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
  if (THREE.RoomEnvironment) {
    var pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  }
  var key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(2, 3, 4);
  var rim = new THREE.DirectionalLight(0xffe0d0, 0.8); rim.position.set(-3, 1, -2);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a3a20, 0.6), key, rim);

  var grupa = new THREE.Group(); scene.add(grupa);

  var bin = atob(window.BAKLJA_GLB), buf = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  new THREE.GLTFLoader().parse(buf.buffer, '', function (gltf) {
    var m = gltf.scene;
    var box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    m.position.sub(c);
    var k = 1 / s.y; m.scale.setScalar(k); m.position.multiplyScalar(k);
    grupa.add(m);
  });

  // ===== PLAMEN: čestice koje izlaze iz vrha baklje i uvijek se dižu prema gore =====
  var N = 420, pos = new Float32Array(N * 3), life = new Float32Array(N), seed = new Float32Array(N), vel = [];
  var fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  fg.setAttribute('life', new THREE.BufferAttribute(life, 1));
  fg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  var fmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uScale: { value: 400 } },
    vertexShader: [
      'attribute float life; attribute float seed; varying float vLife; varying float vSeed; uniform float uScale;',
      'void main(){ vLife=life; vSeed=seed; vec4 mv=modelViewMatrix*vec4(position,1.0);',
      ' float s=mix(0.075,0.012,pow(life,0.8))*(0.75+seed*0.5);',
      ' gl_PointSize= life>0.999?0.0:s*uScale/-mv.z; gl_Position=projectionMatrix*mv; }'
    ].join('\n'),
    fragmentShader: [
      'varying float vLife; varying float vSeed;',
      'void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard;',
      ' float soft=smoothstep(0.5,0.0,d);',
      ' vec3 c0=vec3(1.0,0.98,0.85), c1=vec3(1.0,0.82,0.25), c2=vec3(1.0,0.42,0.08), c3=vec3(0.75,0.12,0.03);',
      ' vec3 col= vLife<0.15? mix(c0,c1,vLife/0.15) : vLife<0.45? mix(c1,c2,(vLife-0.15)/0.3) : mix(c2,c3,(vLife-0.45)/0.55);',
      ' float a=smoothstep(0.0,0.06,vLife)*(1.0-smoothstep(0.55,1.0,vLife));',
      ' gl_FragColor=vec4(col, soft*a*0.9); }'
    ].join('\n')
  });
  var flame = new THREE.Points(fg, fmat); flame.frustumCulled = false; flame.renderOrder = 2; scene.add(flame);
  var glow = new THREE.PointLight(0xffa040, 0.9, 0.9, 2); scene.add(glow);
  var tip = new THREE.Vector3(), up = new THREE.Vector3(0, 0.515, 0);
  function respawn(i) {
    var a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.026;
    pos[i*3] = tip.x + Math.cos(a) * r; pos[i*3+1] = tip.y; pos[i*3+2] = tip.z + Math.sin(a) * r;
    vel[i] = { x: -Math.cos(a) * r * 0.9, y: 0.32 + Math.random() * 0.3, z: -Math.sin(a) * r * 0.9, ph: Math.random() * 6.28 };
    life[i] = 0; seed[i] = Math.random();
  }
  for (var j = 0; j < N; j++) { life[j] = Math.random(); seed[j] = Math.random(); vel[j] = { x: 0, y: 0.3, z: 0, ph: Math.random() * 6.28 }; }
  var started = false, t0 = performance.now(), last = t0;
  function updFlame() {
    var now = performance.now(), dt = Math.min(0.05, (now - last) / 1000), t = (now - t0) / 1000; last = now;
    grupa.updateMatrixWorld(true); tip.copy(up); grupa.localToWorld(tip);
    if (!started && grupa.children.length) { for (var k = 0; k < N; k++) { respawn(k); life[k] = Math.random(); } started = true; }
    for (var i = 0; i < N; i++) {
      var v = vel[i]; life[i] += dt * (0.8 + seed[i] * 0.5);
      if (life[i] >= 1) { respawn(i); continue; }
      var sway = Math.sin(t * 6 + v.ph) * 0.05 * life[i];
      pos[i*3] += (v.x + sway) * dt; pos[i*3+1] += v.y * dt * (1 + life[i]); pos[i*3+2] += (v.z + Math.cos(t * 5 + v.ph) * 0.03 * life[i]) * dt;
      v.x *= 0.96; v.z *= 0.96;
    }
    fg.attributes.position.needsUpdate = true; fg.attributes.life.needsUpdate = true;
    flame.visible = started;
    glow.position.set(tip.x, tip.y + 0.06, tip.z); glow.intensity = started ? 0.8 + Math.sin(t * 13) * 0.15 + Math.sin(t * 7.3) * 0.1 : 0;
  }

  function resize() {
    var w = el.clientWidth || 1, h = el.clientHeight || 1;
    renderer.setSize(w, h, false);
    if (typeof fmat !== 'undefined') fmat.uniforms.uScale.value = h * renderer.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(15)));
    camera.aspect = w / h;
    var dist = 0.72 / Math.tan(THREE.MathUtils.degToRad(15));
    camera.position.set(0, 0.12, dist);
    camera.updateProjectionMatrix();
  }
  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(el); else addEventListener('resize', resize);

  var sekcija = el.closest('section') || el.parentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ciljY = 0, rotY = 0, rotX = 0, vidljivo = true, ciljS = 1, sk = 1;
  function napredak() {
    var r = sekcija.getBoundingClientRect(), vh = innerHeight;
    var p = Math.max(0, Math.min(1, (vh - r.top) / (vh + r.height)));
    ciljY = reduce ? 0 : (0.5 - p) * Math.PI;
    ciljS = reduce ? 1 : 0.88 + p * 0.17;
  }
  addEventListener('scroll', napredak, { passive: true });
  napredak(); rotY = ciljY; sk = ciljS;
  if (window.IntersectionObserver) new IntersectionObserver(function (e) { vidljivo = e[0].isIntersecting; }).observe(el);

  var drag = false, lx = 0, ly = 0, dodY = 0, dodX = 0, velY = 0, velX = 0, cv = renderer.domElement;
  cv.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; velX = velY = 0; el.classList.add('drag'); if (e.pointerType === 'mouse') cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', function (e) {
    if (!drag) return;
    velY = (e.clientX - lx) * 0.008; velX = (e.clientY - ly) * 0.008;
    if (e.pointerType !== 'mouse') velX = 0;
    dodY += velY; dodX = Math.max(-1, Math.min(1, dodX + velX)); lx = e.clientX; ly = e.clientY;
  });
  function pusti() { drag = false; el.classList.remove('drag'); }
  cv.addEventListener('pointerup', pusti); cv.addEventListener('pointercancel', pusti);

  (function petlja() {
    requestAnimationFrame(petlja);
    if (!vidljivo) return;
    if (!drag) { dodY += velY; dodX += velX; velY *= 0.93; velX *= 0.93; dodX += (0 - dodX) * 0.06; }
    rotY += (ciljY + dodY - rotY) * (drag ? 0.3 : 0.05);
    rotX += (dodX - rotX) * 0.3;
    sk += (ciljS - sk) * 0.05;
    grupa.scale.setScalar(sk);
    grupa.rotation.set(rotX, rotY, 0.12);
    updFlame();
    renderer.render(scene, camera);
  })();
})();
