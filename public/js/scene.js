/* Office Hub: ฉาก 3D ห้องออฟฟิศจิ๋ว + จุดคลิกของแต่ละบริการ + API ให้ app.js เรียกใช้ (window.OfficeScene) */
(() => {
  const stage = document.getElementById('stage');
  const canvas = document.getElementById('scene');
  const fallback = document.getElementById('fallback');
  if (!window.THREE) { fallback.hidden = false; return; }
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) { fallback.hidden = false; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const HOME = new THREE.Vector3(9.7, 7.7, 9.7);
  const TARGET = new THREE.Vector3(0, 1.35, 0);
  camera.position.copy(HOME).multiplyScalar(calm ? 1 : 1.35);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.target.copy(TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.38;
  controls.minAzimuthAngle = 0.02;
  controls.maxAzimuthAngle = 1.55;
  controls.autoRotateSpeed = 0.35;

  /* ---------- event bus for the app shell ---------- */
  const listeners = {};
  const emit = (ev, ...args) => (listeners[ev] || []).forEach(fn => { try { fn(...args); } catch (e) { console.error(e); } });
  const hub = { kidLine: null };

  /* ---------- helpers ---------- */
  const rng = (s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; })(11);
  const lerp = (a, b, t) => a + (b - a) * t;
  const mat = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.78, metalness: 0 }, extra || {}));
  const put = (parent, mesh, x = 0, y = 0, z = 0) => { mesh.position.set(x, y, z); parent.add(mesh); return mesh; };
  const HAS_RB = !!THREE.RoundedBoxGeometry;
  const rbox = (w, h, d, r, m) => new THREE.Mesh(HAS_RB ? new THREE.RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 0.001)) : new THREE.BoxGeometry(w, h, d), m);
  const sphere = (r, m, ws = 24, hs = 18) => new THREE.Mesh(new THREE.SphereGeometry(r, ws, hs), m);
  const cyl = (rt, rb, h, m, seg = 28) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 8, 16), m);
  const torus = (r, t, m, arc = Math.PI * 2, rs = 10, ts = 28) => new THREE.Mesh(new THREE.TorusGeometry(r, t, rs, ts, arc), m);
  const Z = new THREE.Vector3(0, 0, 1), DOWN = new THREE.Vector3(0, -1, 0);
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.userData = { canvas: c, g };
    return t;
  }
  function heartPath(g, cx, cy, s) {
    g.beginPath(); g.moveTo(cx, cy + 0.42 * s);
    g.bezierCurveTo(cx - 0.55 * s, cy + 0.05 * s, cx - 0.5 * s, cy - 0.42 * s, cx - 0.22 * s, cy - 0.42 * s);
    g.bezierCurveTo(cx - 0.08 * s, cy - 0.42 * s, cx, cy - 0.32 * s, cx, cy - 0.2 * s);
    g.bezierCurveTo(cx, cy - 0.32 * s, cx + 0.08 * s, cy - 0.42 * s, cx + 0.22 * s, cy - 0.42 * s);
    g.bezierCurveTo(cx + 0.5 * s, cy - 0.42 * s, cx + 0.55 * s, cy + 0.05 * s, cx, cy + 0.42 * s);
    g.closePath();
  }

  /* ---------- textures ---------- */
  const woodTex = canvasTex(512, 512, (g, w, h) => {
    const tones = ['#e2ad7f', '#d9a274', '#e7b78b', '#d49a6b'];
    const rows = 8, ph = h / rows;
    for (let i = 0; i < rows; i++) {
      let x = -((i * 97) % 180);
      let k = i;
      while (x < w) {
        const len = 190 + ((k * 53) % 130);
        g.fillStyle = tones[k % 4]; g.fillRect(x, i * ph, len, ph);
        g.fillStyle = 'rgba(130,78,45,.35)'; g.fillRect(x + len - 2, i * ph, 2, ph);
        x += len; k++;
      }
      g.fillStyle = 'rgba(130,78,45,.4)'; g.fillRect(0, i * ph, w, 2);
    }
    g.strokeStyle = 'rgba(140,85,50,.12)'; g.lineWidth = 1.5;
    for (let n = 0; n < 70; n++) { const y = rng() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 5, w * .6, y - 5, w, y + 2); g.stroke(); }
  });

  const wallTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#c3e6d8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d6efe5';
    [[32, 32], [96, 96]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fill(); });
  });
  wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(6, 4);

  function drawCity(g, w, h, night) {
    const cols = night ? ['#2b2e5c', '#34386b', '#282b54'] : ['#b7d6ef', '#cbe3f6', '#a8cae8'];
    let x = -12, i = 0;
    while (x < w) {
      const bw = 52 + ((i * 37) % 44), bh = 70 + ((i * 71) % 100);
      g.fillStyle = cols[i % 3]; rr(g, x, h - bh, bw, bh + 30, 12); g.fill();
      g.fillStyle = night ? '#ffd77a' : 'rgba(255,255,255,.65)';
      for (let yy = h - bh + 16; yy < h - 12; yy += 20)
        for (let xx = x + 11; xx < x + bw - 12; xx += 15)
          if (!night || ((xx * 7 + yy * 3 + i) % 5) < 2) g.fillRect(xx, yy, 7, 9);
      x += bw + 7; i++;
    }
  }
  function cloud(g, x, y, s) { g.beginPath(); g.arc(x, y, 22 * s, 0, Math.PI * 2); g.arc(x + 26 * s, y - 10 * s, 28 * s, 0, Math.PI * 2); g.arc(x + 56 * s, y, 22 * s, 0, Math.PI * 2); g.rect(x, y, 56 * s, 22 * s); g.fill(); }
  const skyDay = canvasTex(512, 364, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(1, '#e2f4ff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,224,130,.35)'; g.beginPath(); g.arc(400, 80, 62, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe07a'; g.beginPath(); g.arc(400, 80, 40, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; cloud(g, 70, 90, 1.2); cloud(g, 250, 150, .8); cloud(g, 330, 40, .6);
    drawCity(g, w, h, false);
  });
  const skyNight = canvasTex(512, 364, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#171a44'); gr.addColorStop(1, '#4a3a7a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${.4 + rng() * .6})`; g.beginPath(); g.arc(rng() * w, rng() * h * .65, rng() * 1.8 + .5, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = 'rgba(255,240,180,.18)'; g.beginPath(); g.arc(390, 85, 60, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff1b8'; g.beginPath(); g.arc(390, 85, 36, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#1f2250'; g.beginPath(); g.arc(406, 74, 32, 0, Math.PI * 2); g.fill();
    drawCity(g, w, h, true);
  });

  const stickerTex = canvasTex(128, 128, (g) => {
    g.fillStyle = '#ff8fab'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff'; heartPath(g, 64, 68, 70); g.fill();
  });
  const heartTex = canvasTex(128, 128, (g) => { g.fillStyle = '#ff6f98'; heartPath(g, 64, 66, 110); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(42, 42, 10, 6, -0.6, 0, Math.PI * 2); g.fill(); });
  const puffTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const zTex = canvasTex(128, 128, (g) => { g.fillStyle = '#7d6bd6'; g.font = 'bold 96px "Mali", "Comic Sans MS", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('z', 64, 62); });

  const picTex1 = canvasTex(256, 200, (g, w, h) => {
    g.fillStyle = '#ffe3ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd166'; g.beginPath(); g.arc(180, 60, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#9fd8c8'; g.beginPath(); g.moveTo(0, h); g.lineTo(80, 80); g.lineTo(160, h); g.fill();
    g.fillStyle = '#76c2ad'; g.beginPath(); g.moveTo(90, h); g.lineTo(175, 105); g.lineTo(256, h); g.fill();
  });
  const picTex2 = canvasTex(200, 200, (g, w, h) => {
    g.fillStyle = '#e4eaff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f5a65b';
    g.beginPath(); g.moveTo(52, 70); g.lineTo(66, 28); g.lineTo(92, 60); g.fill();
    g.beginPath(); g.moveTo(148, 70); g.lineTo(134, 28); g.lineTo(108, 60); g.fill();
    g.beginPath(); g.arc(100, 105, 55, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#3b2a2a'; g.beginPath(); g.arc(80, 100, 6, 0, Math.PI * 2); g.arc(120, 100, 6, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ff8fab'; g.beginPath(); g.arc(100, 116, 5, 0, Math.PI * 2); g.fill();
  });
  const noteTex = (bg, ink) => canvasTex(96, 96, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = ink; g.lineWidth = 4; g.lineCap = 'round';
    [30, 48, 66].forEach((y, i) => { g.beginPath(); g.moveTo(16, y); g.quadraticCurveTo(40, y - 5, 60 + (i % 2) * 16, y); g.stroke(); });
  });

  /* laptop screen: code that types itself */
  const palette = ['#ff8fab', '#ffd166', '#8fe3c8', '#a9c3ff', '#c9b6ff', '#f2f3fb'];
  const codeLines = Array.from({ length: 36 }, (_, i) => {
    const indent = [0, 1, 2, 2, 1, 2, 3, 1][i % 8];
    const segs = []; const n = 1 + Math.floor(rng() * 4);
    for (let s = 0; s < n; s++) segs.push({ w: 24 + rng() * 70, c: palette[Math.floor(rng() * palette.length)] });
    return { indent, segs };
  });
  const screenTex = canvasTex(512, 320, () => {});
  let typed = 0;
  function drawScreen(blink) {
    const g = screenTex.userData.g;
    g.fillStyle = '#2a2d45'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#363b5c'; g.fillRect(0, 0, 512, 36);
    ['#ff7fa3', '#ffd166', '#7fd6b8'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(22 + i * 20, 18, 6, 0, Math.PI * 2); g.fill(); });
    g.fillStyle = '#c9cde8'; g.font = '600 16px sans-serif'; g.fillText('tiny_office.js', 90, 24);
    const full = Math.floor(typed), frac = typed - full, first = Math.max(0, full - 11);
    let cx = 60, cy = 56;
    for (let i = first; i <= Math.min(full, codeLines.length - 1); i++) {
      const row = i - first, y = 56 + row * 22, ln = codeLines[i];
      g.fillStyle = '#5d6385'; g.font = '14px monospace'; g.fillText(String(i + 1).padStart(2, ' '), 14, y + 9);
      let x = 52 + ln.indent * 22;
      const limit = i === full ? frac : 1;
      const total = ln.segs.reduce((a, s) => a + s.w + 8, 0);
      let budget = total * limit;
      for (const s of ln.segs) {
        if (budget <= 0) break;
        const sw = Math.min(s.w, budget); g.fillStyle = s.c; rr(g, x, y, Math.max(4, sw), 11, 5); g.fill();
        x += s.w + 8; budget -= s.w + 8;
      }
      cx = 52 + ln.indent * 22 + total * limit; cy = y;
    }
    if (blink) { g.fillStyle = '#ffffff'; g.fillRect(cx + 2, cy - 3, 3, 17); }
    screenTex.needsUpdate = true;
  }
  drawScreen(true);

  /* ---------- lights ---------- */
  const hemi = new THREE.HemisphereLight('#fff4ec', '#d9b3a6', 0.95); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0dc', 1.6);
  sun.position.set(6, 11, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 32 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#d4e6ff', 0.35); fill.position.set(-2, 5, 9); scene.add(fill);

  /* ---------- room shell ---------- */
  const room = new THREE.Group(); scene.add(room);
  put(room, rbox(6.5, 0.4, 6.5, 0.14, mat('#ffffff', { map: woodTex })), 0, -0.2, 0);
  const wallM = mat('#ffffff', { map: wallTex });
  put(room, rbox(6.5, 4.4, 0.3, 0.12, wallM), 0, 1.8, -3.1);
  put(room, rbox(0.3, 4.4, 6.5, 0.12, wallM), -3.1, 1.8, 0);
  const white = mat('#fffaf6');
  put(room, rbox(6.2, 0.18, 0.07, 0.03, white), 0.12, 0.09, -2.92);
  put(room, rbox(0.07, 0.18, 6.2, 0.03, white), -2.92, 0.09, 0.12);

  /* window */
  const win = new THREE.Group(); win.position.set(1.25, 2.35, -2.95); room.add(win);
  const GW = 1.9, GH = 1.35;
  put(win, new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshBasicMaterial({ map: skyDay, toneMapped: false })), 0, 0, 0.012);
  const nightGlass = put(win, new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshBasicMaterial({ map: skyNight, toneMapped: false, transparent: true, opacity: 0 })), 0, 0, 0.016);
  put(win, rbox(GW + 0.22, 0.12, 0.14, 0.05, white), 0, GH / 2 + 0.05, 0.05);
  put(win, rbox(GW + 0.22, 0.12, 0.14, 0.05, white), 0, -GH / 2 - 0.05, 0.05);
  put(win, rbox(0.12, GH + 0.2, 0.14, 0.05, white), -GW / 2 - 0.05, 0, 0.05);
  put(win, rbox(0.12, GH + 0.2, 0.14, 0.05, white), GW / 2 + 0.05, 0, 0.05);
  put(win, rbox(0.06, GH, 0.08, 0.02, white), 0, 0, 0.04);
  put(win, rbox(GW, 0.06, 0.08, 0.02, white), 0, 0.1, 0.04);
  put(win, rbox(GW + 0.55, 0.08, 0.34, 0.03, white), 0, -GH / 2 - 0.14, 0.17);
  const rod = put(win, cyl(0.028, 0.028, GW + 1.4, mat('#e7b98a')), 0, GH / 2 + 0.3, 0.15); rod.rotation.z = Math.PI / 2;
  [-1, 1].forEach(s => put(win, sphere(0.06, mat('#e7b98a')), s * (GW / 2 + 0.7), GH / 2 + 0.3, 0.15));
  const curtM = mat('#ffb6c8', { roughness: 0.9 });
  [-1, 1].forEach(s => {
    for (let k = 0; k < 3; k++) put(win, capsule(0.085, 1.55, curtM), s * (GW / 2 + 0.3) + (k - 1) * 0.14, -0.05, 0.12 + (k % 2) * 0.035);
    const tie = put(win, torus(0.24, 0.035, mat('#ffd166')), s * (GW / 2 + 0.3), -0.25, 0.14); tie.rotation.x = Math.PI / 2; tie.scale.set(1, 0.55, 1);
  });
  /* tiny succulent on the sill */
  const sillY = -GH / 2 - 0.1;
  put(win, cyl(0.09, 0.07, 0.15, mat('#fffaf6')), GW / 2 - 0.25, sillY + 0.075, 0.2);
  put(win, sphere(0.08, mat('#7cc67f')), GW / 2 - 0.25, sillY + 0.18, 0.2).scale.set(1, 0.8, 1);
  put(win, sphere(0.05, mat('#9edb8f')), GW / 2 - 0.2, sillY + 0.24, 0.22);
  put(win, cyl(0.075, 0.065, 0.13, mat('#ffd166')), -GW / 2 + 0.3, sillY + 0.065, 0.2);
  put(win, capsule(0.045, 0.1, mat('#6fbf73')), -GW / 2 + 0.3, sillY + 0.2, 0.2);

  /* wall clock showing the viewer's real time */
  const clockG = new THREE.Group(); clockG.position.set(-1.55, 3.2, -2.95); room.add(clockG);
  const clockBody = put(clockG, cyl(0.4, 0.4, 0.1, mat('#ffd166'), 40), 0, 0, 0.05); clockBody.rotation.x = Math.PI / 2;
  put(clockG, new THREE.Mesh(new THREE.CircleGeometry(0.33, 40), mat('#fffaf6')), 0, 0, 0.102);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; put(clockG, sphere(i % 3 ? 0.016 : 0.028, mat('#8c7080'), 8, 6), Math.sin(a) * 0.26, Math.cos(a) * 0.26, 0.11); }
  const handMesh = (len, w, color, z) => { const geo = new THREE.BoxGeometry(w, len, 0.012); geo.translate(0, len / 2 - 0.03, 0); return put(clockG, new THREE.Mesh(geo, mat(color)), 0, 0, z); };
  const hourHand = handMesh(0.16, 0.035, '#4b3540', 0.115), minHand = handMesh(0.24, 0.025, '#4b3540', 0.125), secHand = handMesh(0.26, 0.01, '#ff7fa3', 0.135);
  put(clockG, sphere(0.025, mat('#ff7fa3'), 10, 8), 0, 0, 0.14);
  /* ears on the clock */
  [-1, 1].forEach(s => { const e = put(clockG, new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 20), mat('#ffd166')), s * 0.27, 0.36, 0.05); e.rotation.z = -s * 0.5; });

  /* cork board with sticky notes */
  const cork = new THREE.Group(); cork.position.set(-0.3, 2.55, -2.95); room.add(cork);
  put(cork, rbox(0.95, 0.68, 0.05, 0.02, mat('#d9a877', { roughness: 1 })), 0, 0, 0.025);
  [['#fff1a8', '#e2b94a', -0.24, 0.12, 0.08], ['#ffd1dc', '#e07b98', 0.14, 0.14, -0.1], ['#cdeee2', '#5fb09a', -0.1, -0.15, -0.05], ['#dfe4ff', '#7d8fe0', 0.26, -0.14, 0.12]]
    .forEach(([bg, ink, x, y, r]) => {
      const n = put(cork, new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), mat('#ffffff', { map: noteTex(bg, ink) })), x, y, 0.055); n.rotation.z = r;
      put(cork, sphere(0.022, mat(ink), 8, 6), x, y + 0.1, 0.07);
    });

  /* pictures on the left wall */
  function picture(tex, w, h, z, y, frameColor) {
    const g = new THREE.Group(); g.position.set(-2.95, y, z); g.rotation.y = Math.PI / 2; room.add(g);
    put(g, rbox(w + 0.1, h + 0.1, 0.05, 0.02, mat(frameColor)), 0, 0, 0.025);
    put(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex })), 0, 0, 0.052);
  }
  picture(picTex2, 0.42, 0.42, 0.62, 3.2, '#ffb6c8');
  void picTex1;

  /* wall TV (YouTube hotspot) */
  const tv = new THREE.Group(); tv.position.set(-2.95, 2.5, -0.35); tv.rotation.y = Math.PI / 2; room.add(tv);
  put(tv, rbox(1.28, 0.8, 0.08, 0.05, mat('#4b4f6e', { roughness: 0.5 })), 0, 0, 0.04);
  const tvTex = canvasTex(512, 288, () => {});
  put(tv, new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.66), new THREE.MeshBasicMaterial({ map: tvTex, toneMapped: false })), 0, 0, 0.082);
  put(tv, sphere(0.018, mat('#8fe3c8', { emissive: new THREE.Color('#8fe3c8'), emissiveIntensity: 1.2 }), 8, 6), 0.56, -0.36, 0.085).userData.noShadow = true;
  let tvVideo = null, tvAcc = 0;
  function drawTV() {
    const g = tvTex.userData.g, W = 512, H = 288;
    g.textAlign = 'left';
    if (!tvVideo) {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#2b2e4a'); gr.addColorStop(1, '#46365e');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ff6f8e'; rr(g, W / 2 - 48, H / 2 - 44, 96, 68, 18); g.fill();
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(W / 2 - 11, H / 2 - 28); g.lineTo(W / 2 + 19, H / 2 - 10); g.lineTo(W / 2 - 11, H / 2 + 8); g.closePath(); g.fill();
      g.fillStyle = '#c9cde8'; g.font = '600 22px "Mali", sans-serif'; g.textAlign = 'center';
      g.fillText('เลือกวิดีโอเพื่อดูบนทีวี', W / 2, H - 52); g.textAlign = 'left';
    } else {
      const [c1, c2] = tvVideo.colors, t = tvVideo.p * tvVideo.len;
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = 'rgba(255,255,255,.18)';
        g.beginPath(); g.arc((i * 131 + t * 40) % (W + 120) - 60, 70 + (i % 3) * 55 + Math.sin(t + i) * 14, 26 + i * 9, 0, Math.PI * 2); g.fill();
      }
      const shade = g.createLinearGradient(0, H * 0.45, 0, H); shade.addColorStop(0, 'rgba(25,18,40,0)'); shade.addColorStop(1, 'rgba(25,18,40,.72)');
      g.fillStyle = shade; g.fillRect(0, 0, W, H);
      g.fillStyle = '#ffffff'; g.font = '700 25px "Mali", sans-serif';
      g.fillText(tvVideo.title.length > 26 ? tvVideo.title.slice(0, 25) + '…' : tvVideo.title, 22, H - 54);
      g.font = '500 17px "Mali", sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillText(tvVideo.channel, 22, H - 30);
      g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, H - 8, W, 8);
      g.fillStyle = '#ff6f8e'; g.fillRect(0, H - 8, W * tvVideo.p, 8);
    }
    tvTex.needsUpdate = true;
  }
  drawTV();

  /* fairy lights along the top of both walls */
  const bulbCols = ['#ff8fab', '#ffd166', '#8fe3c8', '#a9c3ff'];
  const bulbMats = bulbCols.map(c => mat(c, { emissive: new THREE.Color(c), emissiveIntensity: 0.3, roughness: 0.35 }));
  const wireM = mat('#7a6870');
  function fairy(fn) {
    const pts = []; for (let i = 0; i <= 48; i++) pts.push(fn(i / 48));
    const curve = new THREE.CatmullRomCurve3(pts);
    const wire = put(room, new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.012, 6, false), wireM)); wire.userData.noShadow = true;
    const n = Math.round(curve.getLength() / 0.4);
    for (let i = 1; i < n; i++) { const p = curve.getPoint(i / n); const b = put(room, sphere(0.06, bulbMats[i % 4], 14, 10), p.x, p.y - 0.07, p.z); b.scale.set(1, 1.3, 1); b.userData.noShadow = true; }
  }
  fairy(u => new THREE.Vector3(lerp(3.15, -2.88, u), 3.92 - 0.24 * Math.abs(Math.sin(u * Math.PI * 3)), -2.86));
  fairy(u => new THREE.Vector3(-2.86, 3.92 - 0.24 * Math.abs(Math.sin(u * Math.PI * 3)), lerp(-2.88, 3.15, u)));

  /* bookshelf */
  const shelf = new THREE.Group(); shelf.position.set(-2.66, 0, 1.6); room.add(shelf);
  const shelfWood = mat('#eab98a'); const SW = 1.7, SH = 2.5, SD = 0.55;
  put(shelf, rbox(SD, SH, 0.08, 0.03, shelfWood), 0, SH / 2, -SW / 2);
  put(shelf, rbox(SD, SH, 0.08, 0.03, shelfWood), 0, SH / 2, SW / 2);
  put(shelf, rbox(SD + 0.04, 0.08, SW + 0.04, 0.03, shelfWood), 0, SH, 0);
  put(shelf, rbox(0.04, SH, SW, 0.015, mat('#f8dcc2')), -SD / 2 + 0.03, SH / 2, 0);
  const levels = [0.06, 0.86, 1.66];
  levels.forEach(y => put(shelf, rbox(SD, 0.08, SW - 0.04, 0.03, shelfWood), 0, y, 0));
  const bookCols = ['#ff9fb5', '#ffd166', '#8fd3c1', '#9db8ff', '#c7a6ff', '#ffb38a', '#fff3e6', '#7d8fe0'];
  levels.forEach((y, li) => {
    let z = -SW / 2 + 0.09;
    const stop = li === 1 ? 0.2 : li === 2 ? 0.05 : SW / 2 - 0.12;
    while (z < stop) {
      const t = 0.075 + rng() * 0.06, h = 0.4 + rng() * 0.2;
      const b = put(shelf, rbox(0.36, h, t, 0.018, mat(bookCols[Math.floor(rng() * bookCols.length)])), 0.04, y + 0.04 + h / 2, z + t / 2);
      put(shelf, rbox(0.362, 0.03, t + 0.002, 0.005, mat('#ffffff')), 0.04, y + 0.04 + h * 0.75, z + t / 2);
      z += t + 0.01;
      void b;
    }
    if (li === 1) { // little potted plant
      put(shelf, cyl(0.12, 0.1, 0.2, mat('#ffffff')), 0.04, y + 0.14, 0.55);
      [[0, 0.32, 0], [0.06, 0.28, 0.08], [-0.05, 0.27, -0.07]].forEach(([dx, dy, dz]) => put(shelf, sphere(0.1, mat('#6fbf73')), 0.04 + dx, y + dy, 0.55 + dz).scale.set(1, 0.85, 1));
    }
    if (li === 2) { // stacked books + ball
      [0, 1, 2].forEach(k => put(shelf, rbox(0.34, 0.07, 0.34, 0.02, mat(bookCols[(k * 3 + 1) % 8])), 0.04, y + 0.075 + k * 0.075, 0.4).rotation.y = k * 0.2);
      put(shelf, sphere(0.13, mat('#8fd3c1')), 0.04, y + 0.4, 0.4);
    }
  });
  /* trailing plant on top of the shelf */
  put(shelf, cyl(0.15, 0.12, 0.24, mat('#ffd1dc')), 0.05, SH + 0.16, -0.45);
  const vineM = mat('#5fb36b');
  for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) {
    const p = put(shelf, sphere(0.06, i % 2 ? vineM : mat('#7cc67f'), 12, 8), 0.2 + i * 0.03, SH + 0.24 - i * 0.16, -0.45 + (k ? 0.12 : -0.08) + Math.sin(i) * 0.04);
    p.scale.set(0.6, 1, 1);
  }
  put(shelf, sphere(0.14, vineM), 0.05, SH + 0.32, -0.45).scale.set(1.1, 0.7, 1.1);

  /* rug */
  put(room, cyl(1.7, 1.7, 0.03, mat('#ffc4d1', { roughness: 1 }), 64), 0.9, 0.015, 0.9);
  put(room, cyl(1.32, 1.32, 0.034, mat('#ffe0e7', { roughness: 1 }), 64), 0.9, 0.017, 0.9);
  put(room, cyl(0.9, 0.9, 0.038, mat('#ffc4d1', { roughness: 1 }), 64), 0.9, 0.019, 0.9);

  /* big plant in the corner */
  const plant = new THREE.Group(); plant.position.set(2.45, 0, -2.3); room.add(plant);
  put(plant, cyl(0.36, 0.28, 0.6, mat('#ffffff')), 0, 0.3, 0);
  put(plant, torus(0.36, 0.035, mat('#8fd3c1')), 0, 0.58, 0).rotation.x = Math.PI / 2;
  put(plant, cyl(0.33, 0.33, 0.04, mat('#7a5240')), 0, 0.57, 0);
  const leafCols = ['#5fb36b', '#7cc67f', '#4fa35f'];
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2 + rng() * 0.3;
    const holder = new THREE.Group(); holder.position.y = 0.6; holder.rotation.y = a; plant.add(holder);
    const tilt = new THREE.Group(); tilt.rotation.x = 0.35 + rng() * 0.6; holder.add(tilt);
    const len = 0.7 + rng() * 0.4;
    put(tilt, cyl(0.015, 0.015, len * 0.6, mat('#4fa35f')), 0, len * 0.3, 0);
    const leaf = put(tilt, sphere(0.3, mat(leafCols[i % 3]), 20, 14), 0, len * 0.6 + 0.18, 0); leaf.scale.set(0.6, 1, 0.16);
  }

  /* pouf */
  const pouf = put(room, sphere(0.5, mat('#cbb8ff', { roughness: 0.95 }), 32, 20), 2.35, 0.27, -0.75); pouf.scale.set(1, 0.55, 1);
  put(room, sphere(0.04, mat('#a993f2'), 10, 8), 2.35, 0.545, -0.75);

  /* bin + paper ball */
  put(room, cyl(0.2, 0.16, 0.42, mat('#a9c3ff')), 0.55, 0.21, -2.5);
  put(room, sphere(0.09, mat('#fffaf6', { flatShading: true }), 7, 5), 0.55, 0.44, -2.48);
  put(room, sphere(0.08, mat('#fffaf6', { flatShading: true }), 7, 5), 0.98, 0.08, -2.15);

  /* ---------- workstation (rotated 45° so the character faces the camera) ---------- */
  const ws = new THREE.Group(); ws.position.set(-0.85, 0, -0.85); ws.rotation.y = Math.PI / 4; room.add(ws);
  const deskTop = mat('#f2c79b'), deskBody = mat('#fff6ee');
  put(ws, rbox(2.4, 0.1, 1.0, 0.045, deskTop), 0, 1.25, 0);
  [[-1.1, -0.42], [-1.1, 0.42]].forEach(([x, z]) => put(ws, rbox(0.09, 1.2, 0.09, 0.04, deskBody), x, 0.6, z));
  put(ws, rbox(0.66, 1.18, 0.92, 0.05, deskBody), 0.82, 0.6, 0);
  [0.3, 0.75].forEach(y => { put(ws, rbox(0.56, 0.36, 0.04, 0.03, mat('#ffd1dc')), 0.82, y, 0.47); put(ws, rbox(0.16, 0.035, 0.04, 0.015, white), 0.82, y + 0.08, 0.5); });

  /* laptop */
  const lap = new THREE.Group(); lap.position.set(0, 1.3, -0.15); ws.add(lap);
  const alu = mat('#e7eaf3', { roughness: 0.45, metalness: 0.1 });
  put(lap, rbox(0.92, 0.05, 0.62, 0.02, alu), 0, 0.025, 0);
  put(lap, rbox(0.78, 0.012, 0.28, 0.005, mat('#c9cede')), 0, 0.052, -0.1);
  const lid = new THREE.Group(); lid.position.set(0, 0.05, 0.3); lid.rotation.x = 0.22; lap.add(lid);
  put(lid, rbox(0.92, 0.6, 0.035, 0.02, alu), 0, 0.3, 0);
  const scr = put(lid, new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.52), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })), 0, 0.3, -0.019); scr.rotation.y = Math.PI;
  put(lid, new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), mat('#ffffff', { map: stickerTex, transparent: true })), 0, 0.32, 0.0185);
  const screenLight = new THREE.PointLight('#a9c3ff', 0.15, 3, 2); screenLight.position.set(0, 1.7, -0.6); ws.add(screenLight);

  /* mug + steam */
  const mug = new THREE.Group(); mug.position.set(0.6, 1.3, 0.12); ws.add(mug);
  const mugM = mat('#ff9fb5');
  put(mug, cyl(0.1, 0.09, 0.2, mugM), 0, 0.1, 0);
  put(mug, cyl(0.086, 0.086, 0.01, mat('#7a4a32'), 24), 0, 0.19, 0);
  put(mug, torus(0.055, 0.018, mugM, Math.PI * 2, 8, 16), 0.1, 0.1, 0);
  put(mug, new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), mat('#ffffff', { map: heartTex, transparent: true })), 0, 0.1, 0.1);
  const steam = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, opacity: 0 })); s.userData.phase = i / 3; mug.add(s); return s; });

  /* cactus */
  const cac = new THREE.Group(); cac.position.set(0.98, 1.3, 0.3); ws.add(cac);
  put(cac, cyl(0.08, 0.065, 0.13, white), 0, 0.065, 0);
  put(cac, capsule(0.055, 0.12, mat('#6fbf73')), 0, 0.22, 0);
  put(cac, capsule(0.03, 0.05, mat('#6fbf73')), 0.07, 0.23, 0).rotation.z = -0.7;
  put(cac, sphere(0.03, mat('#ff8fab'), 10, 8), 0, 0.34, 0);

  /* phone on a little stand (LINE hotspot) */
  const phone = new THREE.Group(); phone.position.set(0.66, 1.3, 0.39); phone.rotation.y = -0.2; ws.add(phone);
  put(phone, rbox(0.2, 0.04, 0.14, 0.015, white), 0, 0.02, 0);
  const phoneBody = new THREE.Group(); phoneBody.position.set(0, 0.04, -0.02); phoneBody.rotation.x = -0.28; phone.add(phoneBody);
  put(phoneBody, rbox(0.16, 0.3, 0.022, 0.02, mat('#3a3d55', { roughness: 0.4 })), 0, 0.15, 0);
  const phoneTex = canvasTex(128, 240, () => {});
  put(phoneBody, new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.27), new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false })), 0, 0.15, 0.012);
  let phoneUnread = 0;
  function drawPhone() {
    const g = phoneTex.userData.g, W = 128, H = 240;
    g.fillStyle = '#f2fbf5'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2fc46b'; g.fillRect(0, 0, W, 34);
    g.fillStyle = '#ffffff'; g.font = '700 16px "Mali", sans-serif'; g.textAlign = 'left'; g.fillText('แชท', 12, 24);
    [[0, 52, 70], [1, 86, 56], [0, 120, 84], [1, 154, 48], [0, 188, 64]].forEach(([me, y, w]) => {
      g.fillStyle = me ? '#2fc46b' : '#dfe7e2';
      rr(g, me ? W - 12 - w : 12, y, w, 22, 10); g.fill();
    });
    if (phoneUnread > 0) {
      g.fillStyle = '#ff5c6c'; g.beginPath(); g.arc(W - 22, 17, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff'; g.font = '700 15px sans-serif'; g.textAlign = 'center'; g.fillText(String(Math.min(phoneUnread, 99)), W - 22, 22); g.textAlign = 'left';
    }
    phoneTex.needsUpdate = true;
  }
  drawPhone();

  /* papers + pencil */
  [0, 1, 2].forEach(k => put(ws, rbox(0.3, 0.012, 0.38, 0.004, mat(['#fffaf6', '#ffe8ee', '#eef2ff'][k])), -0.62, 1.307 + k * 0.012, -0.27).rotation.y = (k - 1) * 0.12);
  const pencil = put(ws, cyl(0.014, 0.014, 0.3, mat('#ffd166'), 6), -0.6, 1.355, -0.25); pencil.rotation.set(Math.PI / 2, 0, 0.6);

  /* desk lamp */
  const lampM = mat('#8fe3c8');
  put(ws, cyl(0.15, 0.17, 0.05, lampM), -0.95, 1.325, 0.15);
  put(ws, cyl(0.022, 0.022, 0.6, white), -0.95, 1.62, 0.15);
  put(ws, cyl(0.02, 0.02, 0.32, white), -0.81, 1.92, 0.15).rotation.z = Math.PI / 2;
  put(ws, new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.2, 28, 1, true), new THREE.MeshStandardMaterial({ color: '#8fe3c8', side: THREE.DoubleSide, roughness: 0.6 })), -0.65, 1.86, 0.15);
  const lampBulbM = mat('#fff2c4', { emissive: new THREE.Color('#ffd27a'), emissiveIntensity: 0.2 });
  const lampBulb = put(ws, sphere(0.06, lampBulbM, 14, 10), -0.65, 1.8, 0.15); lampBulb.userData.noShadow = true;
  const lampLight = new THREE.PointLight('#ffc47a', 0, 7, 1.6); lampLight.position.set(-0.65, 1.7, 0.15); ws.add(lampLight);

  /* chair */
  const chair = new THREE.Group(); chair.position.set(0, 0, -0.95); ws.add(chair);
  const chairM = mat('#8fb4ff'), dark = mat('#5d607c');
  put(chair, cyl(0.05, 0.05, 0.6, dark), 0, 0.4, 0);
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2 + 0.3;
    put(chair, rbox(0.42, 0.05, 0.07, 0.02, dark), Math.cos(a) * 0.2, 0.12, Math.sin(a) * 0.2).rotation.y = -a;
    put(chair, sphere(0.055, dark, 12, 8), Math.cos(a) * 0.4, 0.06, Math.sin(a) * 0.4);
  }
  put(chair, rbox(0.86, 0.14, 0.8, 0.06, chairM), 0, 0.76, 0);
  put(chair, rbox(0.86, 0.95, 0.14, 0.06, chairM), 0, 1.3, -0.46);

  /* ---------- the character (girl or boy) ---------- */
  const kid = new THREE.Group(); kid.position.set(0, 0, -0.95); ws.add(kid);
  const body = new THREE.Group(); kid.add(body);
  const skin = mat('#ffd9c4'), hairM = mat('#5b3a2f', { roughness: 0.55, side: THREE.DoubleSide }), hoodie = mat('#ffcf5c'), pants = mat('#7d8fe0'), shoeM = mat('#ffffff');
  const garmentM = mat('#ffcf5c'), scrunchM = mat('#ff8fab'), buttonM = mat('#ffd166');
  const torso = put(body, capsule(0.34, 0.26, hoodie), 0, 1.33, 0); torso.scale.z = 0.85;
  /* outfit accessories, one group per outfit */
  const outfitGroups = {};
  const og = name => { const g = new THREE.Group(); g.visible = false; body.add(g); outfitGroups[name] = g; return g; };
  const gHoodie = og('hoodie');
  put(gHoodie, torus(0.24, 0.085, garmentM, Math.PI * 2, 12, 28), 0, 1.76, -0.02).rotation.x = Math.PI / 2;
  [-0.07, 0.07].forEach(x => { put(gHoodie, cyl(0.012, 0.012, 0.18, white, 6), x, 1.6, 0.3); put(gHoodie, sphere(0.022, white, 8, 6), x, 1.5, 0.3); });
  const gShirt = og('shirt');
  [-1, 1].forEach(s => { const c = put(gShirt, rbox(0.17, 0.06, 0.11, 0.025, white), s * 0.085, 1.76, 0.19); c.rotation.set(-0.35, 0, s * 0.45); });
  put(gShirt, sphere(0.045, garmentM, 12, 10), 0, 1.68, 0.255);
  put(gShirt, rbox(0.09, 0.28, 0.025, 0.012, garmentM), 0, 1.5, 0.295).rotation.x = -0.2;
  const gCardigan = og('cardigan');
  [-1, 1].forEach(s => put(gCardigan, sphere(0.1, white, 16, 10), s * 0.09, 1.75, 0.17).scale.set(1, 0.4, 0.7));
  [1.6, 1.47, 1.34].forEach(y => put(gCardigan, sphere(0.026, white, 10, 8), 0, y, y > 1.5 ? 0.275 : 0.295));
  const gOverall = og('overall');
  put(gOverall, rbox(0.4, 0.3, 0.05, 0.02, garmentM), 0, 1.32, 0.28);
  [-1, 1].forEach(s => {
    put(gOverall, rbox(0.07, 0.4, 0.04, 0.015, garmentM), s * 0.13, 1.63, 0.19).rotation.x = -0.75;
    put(gOverall, sphere(0.028, buttonM, 10, 8), s * 0.13, 1.44, 0.31);
  });
  [-1, 1].forEach(s => {
    put(body, capsule(0.12, 0.36, pants), s * 0.15, 0.95, 0.22).rotation.x = Math.PI / 2;
    put(body, capsule(0.11, 0.55, pants), s * 0.15, 0.55, 0.46);
    put(body, sphere(0.13, shoeM, 16, 12), s * 0.15, 0.12, 0.52).scale.set(0.9, 0.6, 1.4);
  });

  const head = new THREE.Group(); head.position.set(0, 2.2, 0.02); body.add(head);
  put(head, sphere(0.55, skin, 40, 30)).scale.set(1, 0.92, 0.95);
  const cap = put(head, new THREE.Mesh(new THREE.SphereGeometry(0.585, 40, 24, 0, Math.PI * 2, 0, Math.PI * 0.58), hairM), 0, 0.03, -0.01);
  cap.rotation.x = -0.45; cap.scale.set(1, 0.95, 0.98);
  const bangsG = new THREE.Group(); head.add(bangsG);
  [[-0.27, 0.19], [-0.09, 0.23], [0.09, 0.23], [0.27, 0.19]].forEach(([x, y]) => {
    const dir = new THREE.Vector3(x, y, 0.5).normalize();
    const b = put(bangsG, sphere(0.16, hairM, 16, 12), dir.x * 0.5, dir.y * 0.5, dir.z * 0.5);
    b.scale.set(1, 0.7, 0.45); b.quaternion.setFromUnitVectors(Z, dir);
  });
  /* hairstyles, one group per style */
  const hairGroups = {};
  const hg = name => { const g = new THREE.Group(); g.visible = false; head.add(g); hairGroups[name] = g; return g; };
  const shell = (thetaLen) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.6, 40, 24, Math.PI * 0.85, Math.PI * 1.3, 0, Math.PI * thetaLen), hairM); m.position.set(0, 0.02, -0.02); m.scale.set(1, 0.95, 0.98); return m; };
  const gBun = hg('bun');
  [-1, 1].forEach(s => put(gBun, capsule(0.1, 0.32, hairM), s * 0.5, -0.12, 0.04).rotation.z = s * 0.12);
  put(gBun, sphere(0.2, hairM, 20, 14), 0, 0.58, -0.16);
  put(gBun, torus(0.13, 0.045, scrunchM, Math.PI * 2, 8, 20), 0, 0.47, -0.12).rotation.x = Math.PI / 2 - 0.35;
  const gTwin = hg('twin');
  [-1, 1].forEach(s => {
    put(gTwin, capsule(0.09, 0.2, hairM), s * 0.5, -0.06, 0.06).rotation.z = s * 0.1;
    put(gTwin, sphere(0.1, hairM, 14, 10), s * 0.53, 0.14, -0.14);
    put(gTwin, torus(0.08, 0.035, scrunchM, Math.PI * 2, 8, 18), s * 0.6, 0.1, -0.14).rotation.y = Math.PI / 2;
    put(gTwin, capsule(0.13, 0.42, hairM), s * 0.72, -0.2, -0.16).rotation.z = s * 0.38;
    put(gTwin, sphere(0.1, hairM, 14, 10), s * 0.86, -0.5, -0.14);
  });
  const gBob = hg('bob');
  gBob.add(shell(0.7));
  [-1, 1].forEach(s => put(gBob, sphere(0.13, hairM, 14, 10), s * 0.5, -0.28, 0.1).scale.set(0.8, 0.7, 1));
  const gLong = hg('long');
  gLong.add(shell(0.8));
  put(gLong, capsule(0.36, 0.38, hairM), 0, -0.6, -0.24).scale.set(1.05, 1, 0.4);
  [-1, 1].forEach(s => put(gLong, capsule(0.11, 0.62, hairM), s * 0.5, -0.42, 0.08).rotation.z = s * 0.08);
  put(gLong, torus(0.11, 0.03, scrunchM, Math.PI * 1.2, 8, 18), 0.18, 0.5, 0.2).rotation.set(-0.5, 0, 0.4);

  /* boy hairstyles */
  const UP = new THREE.Vector3(0, 1, 0);
  const sph = (theta, phi) => new THREE.Vector3(Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));
  const sideburns = g => [-1, 1].forEach(s => put(g, capsule(0.075, 0.12, hairM), s * 0.52, -0.06, 0.1).rotation.z = s * 0.1);
  const gShort = hg('short');
  sideburns(gShort);
  put(gShort, torus(0.09, 0.028, hairM, Math.PI * 1.3, 8, 18), 0.02, 0.62, 0.02).rotation.set(0, 0.4, 0.2);
  const gSpiky = hg('spiky');
  sideburns(gSpiky);
  [[0.08, 0], [0.5, 0.3], [0.5, 1.6], [0.5, 2.9], [0.55, 4.2], [0.55, 5.3], [0.95, 0.6], [0.95, 2.6], [1.0, 3.8], [1.0, 4.8], [0.95, 5.8]].forEach(([th, ph]) => {
    const dir = sph(th, ph);
    const c = put(gSpiky, new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 14), hairM), dir.x * 0.58, dir.y * 0.56 + 0.03, dir.z * 0.57);
    c.quaternion.setFromUnitVectors(UP, dir);
  });
  const gCurtain = hg('curtain');
  sideburns(gCurtain);
  [-1, 1].forEach(s => {
    const dir = new THREE.Vector3(s * 0.26, 0.26, 0.45).normalize();
    const b = put(gCurtain, sphere(0.24, hairM, 18, 12), dir.x * 0.5, dir.y * 0.5, dir.z * 0.5);
    b.scale.set(1, 0.5, 0.4); b.quaternion.setFromUnitVectors(Z, dir); b.rotateZ(-s * 0.5);
  });
  const gFluffy = hg('fluffy');
  [[0.12, 1], [0.55, 6], [0.95, 9], [1.35, 10], [1.7, 8]].forEach(([th, n]) => {
    for (let i = 0; i < n; i++) {
      const ph = i / n * Math.PI * 2 + th;
      const fromFront = Math.abs(Math.atan2(Math.sin(ph - Math.PI / 2), Math.cos(ph - Math.PI / 2)));
      if (th > 0.8 && fromFront < 0.95) continue;
      const dir = sph(th, ph);
      put(gFluffy, sphere(0.15, hairM, 14, 10), dir.x * 0.57, dir.y * 0.53 + 0.03, dir.z * 0.56);
    }
  });

  const eyeM = mat('#2b1d24', { roughness: 0.25 }), shine = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const lashMeshes = [];
  const eyes = [-1, 1].map(s => {
    const e = new THREE.Group(); e.position.set(s * 0.19, -0.03, 0.485); head.add(e);
    put(e, sphere(0.078, eyeM, 20, 16)).scale.set(0.82, 1.15, 0.5);
    put(e, sphere(0.024, shine, 10, 8), 0.022, 0.04, 0.035);
    put(e, sphere(0.012, shine, 8, 6), -0.02, -0.035, 0.037);
    [[0.055, 0.075, 0.6], [0.075, 0.045, 1.1]].forEach(([x, y, r]) => {
      const l = put(e, capsule(0.011, 0.035, eyeM), s * x, y, 0.02); l.rotation.z = -s * r; lashMeshes.push(l);
    });
    return e;
  });
  const browG = new THREE.Group(); head.add(browG);
  [-1, 1].forEach(s => { const b = put(browG, capsule(0.02, 0.09, hairM), s * 0.19, 0.085, 0.5); b.rotation.z = Math.PI / 2 + s * 0.12; });
  const blushM = mat('#ff8fa8', { transparent: true, opacity: 0.55, roughness: 1 });
  [-1, 1].forEach(s => {
    const dir = new THREE.Vector3(s * 0.33, -0.14, 0.42).normalize();
    const b = put(head, sphere(0.075, blushM, 16, 12), dir.x * 0.53, dir.y * 0.53 * 0.92, dir.z * 0.53 * 0.95);
    b.scale.set(1, 0.6, 0.25); b.quaternion.setFromUnitVectors(Z, dir);
  });
  put(head, torus(0.055, 0.014, mat('#8a3b4a'), Math.PI, 8, 20), 0, -0.15, 0.505).rotation.z = Math.PI;

  const arms = [-1, 1].map(s => {
    const g = new THREE.Group(); body.add(g);
    const shoulder = new THREE.Vector3(s * 0.31, 1.6, 0.04);
    const rest = new THREE.Vector3(s * 0.19, 1.41, 0.66);
    const raised = new THREE.Vector3(s * 0.62, 2.35, 0.3);
    const L = shoulder.distanceTo(rest), r = 0.1;
    put(g, capsule(r, L - 2 * r, hoodie), 0, -L / 2, 0);
    put(g, sphere(0.085, skin, 14, 10), 0, -L, 0);
    g.position.copy(shoulder);
    return { g, s, shoulder, rest, raised };
  });
  const tmpV = new THREE.Vector3();
  function aimArm(a, target) { tmpV.copy(target).sub(a.shoulder).normalize(); a.g.quaternion.setFromUnitVectors(DOWN, tmpV); }

  /* ---------- cat ---------- */
  const cat = new THREE.Group(); cat.position.set(1.5, 0, 1.3); cat.rotation.y = Math.PI / 4; room.add(cat);
  const bedM = mat('#9fd8c8', { roughness: 0.95 });
  put(cat, cyl(0.62, 0.66, 0.12, bedM, 36), 0, 0.06, 0);
  put(cat, torus(0.6, 0.17, bedM, Math.PI * 2, 16, 40), 0, 0.2, 0).rotation.x = Math.PI / 2;
  put(cat, cyl(0.5, 0.5, 0.06, mat('#eaf7f2', { roughness: 1 }), 32), 0, 0.14, 0);
  const fur = mat('#f5a65b'), furLight = mat('#fff3e6'), pink = mat('#ff9fb3'), stripe = mat('#e58b3e');
  const catBody = put(cat, sphere(0.36, fur, 28, 20), 0, 0.36, -0.06); catBody.scale.set(1.15, 0.72, 1);
  [-0.12, 0, 0.12].forEach(z => put(cat, sphere(0.1, stripe, 12, 8), 0, 0.6, z - 0.08).scale.set(2.2, 0.35, 0.45));
  const tail = put(cat, torus(0.4, 0.07, fur, Math.PI * 1.1, 10, 30), 0, 0.2, -0.04); tail.rotation.x = Math.PI / 2; tail.rotation.z = 0.5;
  [[-0.14, 0.38], [0.2, 0.42]].forEach(([x, z]) => put(cat, sphere(0.08, furLight, 14, 10), x, 0.2, z).scale.set(1, 0.7, 1.3));
  const catHead = new THREE.Group(); catHead.position.set(0.08, 0.42, 0.3); cat.add(catHead);
  put(catHead, sphere(0.25, fur, 28, 20)).scale.set(1.08, 0.92, 1);
  put(catHead, sphere(0.11, furLight, 16, 12), 0, -0.07, 0.19).scale.set(1.3, 0.8, 0.7);
  put(catHead, sphere(0.028, pink, 10, 8), 0, -0.02, 0.25);
  [-0.06, 0.06].forEach(x => put(catHead, sphere(0.05, stripe, 10, 8), x, 0.2, 0.06).scale.set(0.5, 0.3, 1));
  const closedEyes = [], openEyes = [];
  [-1, 1].forEach(s => {
    put(catHead, new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.17, 16), fur), s * 0.14, 0.21, -0.02).rotation.z = -s * 0.35;
    put(catHead, new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 12), pink), s * 0.135, 0.2, 0.03).rotation.z = -s * 0.35;
    const ce = put(catHead, torus(0.04, 0.011, mat('#3b2a2a'), Math.PI, 6, 14), s * 0.1, 0.04, 0.232); ce.rotation.z = Math.PI; closedEyes.push(ce);
    const oe = put(catHead, sphere(0.038, eyeM, 12, 10), s * 0.1, 0.03, 0.225); oe.scale.set(0.9, 1.15, 0.6); oe.visible = false; openEyes.push(oe);
    put(catHead, sphere(0.04, mat('#ffb3c3', { transparent: true, opacity: 0.6 }), 10, 8), s * 0.17, -0.06, 0.19).scale.set(1, 0.6, 0.4);
  });
  const zzz = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: zTex, transparent: true, depthWrite: false, opacity: 0 })); s.userData.phase = i / 3; cat.add(s); return s; });

  /* ---------- hearts ---------- */
  const hearts = Array.from({ length: 16 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false, opacity: 0 })); s.visible = false; scene.add(s); return s; });
  function burst(pos, n = 6) {
    let used = 0;
    for (const h of hearts) {
      if (used >= n) break;
      if (h.visible) continue;
      h.visible = true; h.position.copy(pos);
      h.userData = { t: 0, life: 1.4 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.9, vz: (Math.random() - 0.5) * 0.9, vy: 1 + Math.random() * 0.6, s: 0.18 + Math.random() * 0.12 };
      used++;
    }
  }

  /* shadows */
  scene.traverse(o => { if (o.isMesh) { const basic = o.material && o.material.isMeshBasicMaterial; o.castShadow = !basic && !o.userData.noShadow; o.receiveShadow = !basic; } });

  /* ---------- day / night ---------- */
  const C = (h) => new THREE.Color(h);
  const cols = { hemiD: C('#fff4ec'), hemiN: C('#8b8fd6'), gndD: C('#d9b3a6'), gndN: C('#3d335e'), sunD: C('#fff0dc'), sunN: C('#9fb2ff') };
  let night = 0, nightTarget = 0;
  function applyNight(n) {
    hemi.intensity = lerp(0.95, 0.32, n);
    hemi.color.lerpColors(cols.hemiD, cols.hemiN, n);
    hemi.groundColor.lerpColors(cols.gndD, cols.gndN, n);
    sun.intensity = lerp(1.6, 0.4, n);
    sun.color.lerpColors(cols.sunD, cols.sunN, n);
    fill.intensity = lerp(0.35, 0.12, n);
    lampLight.intensity = lerp(0, 2.6, n);
    screenLight.intensity = lerp(0.15, 1.4, n);
    lampBulbM.emissiveIntensity = lerp(0.2, 3.2, n);
    bulbMats.forEach(m => { m.emissiveIntensity = lerp(0.3, 4.5, n); });
    nightGlass.material.opacity = n;
  }
  const btnDay = document.getElementById('btnDay'), btnNight = document.getElementById('btnNight');
  function setMode(mode) {
    nightTarget = mode === 'night' ? 1 : 0;
    stage.dataset.mode = mode;
    btnDay.setAttribute('aria-pressed', String(mode === 'day'));
    btnNight.setAttribute('aria-pressed', String(mode === 'night'));
  }
  const rootTheme = document.documentElement.dataset.theme;
  const startDark = rootTheme ? rootTheme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  setMode(startDark ? 'night' : 'day'); night = nightTarget; applyNight(night);
  btnDay.addEventListener('click', () => setMode('day'));
  btnNight.addEventListener('click', () => setMode('night'));

  /* ---------- dress-up ---------- */
  const HAIR_COLORS = [['#5b3a2f', 'น้ำตาลเข้ม'], ['#241c24', 'ดำ'], ['#c98a4b', 'คาราเมล'], ['#f0c56e', 'บลอนด์'], ['#ff9fbf', 'ชมพู'], ['#9db8ff', 'ฟ้า'], ['#b9a3ff', 'ม่วง']];
  const GENDERS = [['girl', 'ผู้หญิง'], ['boy', 'ผู้ชาย']];
  const HAIR_STYLES = {
    girl: [['bun', 'มวยผม'], ['twin', 'แกละสองข้าง'], ['bob', 'บ็อบสั้น'], ['long', 'ผมยาว']],
    boy: [['short', 'สั้นรองทรง'], ['spiky', 'ผมชี้'], ['curtain', 'แสกกลาง'], ['fluffy', 'ผมฟู']]
  };
  const LINES = {
    girl: { poke: ['สวัสดีค่า!', 'งานใกล้เสร็จแล้วน้า', 'ขอกาแฟอีกแก้วได้มั้ยคะ', 'สู้ๆ วันนี้ก็สู้!', 'พักสายตาแป๊บนึงค่ะ'],
            look: ['ลุคใหม่ น่ารักมั้ยคะ?', 'ชอบแบบนี้จังเลยค่ะ!', 'เปลี่ยนลุคแล้วน้า', 'ใส่ไปทำงานได้มั้ยนะ'] },
    boy: { poke: ['สวัสดีครับ!', 'งานใกล้เสร็จแล้วครับ', 'ขอกาแฟอีกแก้วนะครับ', 'สู้ๆ วันนี้ก็สู้!', 'พักสายตาแป๊บนึงครับ'],
           look: ['ลุคใหม่ เท่มั้ยครับ?', 'ชอบแบบนี้ครับ!', 'เปลี่ยนลุคแล้วครับ', 'ใส่ไปทำงานได้มั้ยนะ'] }
  };
  const OUTFITS = [['hoodie', 'ฮู้ดดี้'], ['shirt', 'เชิ้ตผูกไท'], ['cardigan', 'คาร์ดิแกน'], ['overall', 'เอี๊ยม']];
  const OUTFIT_COLORS = [['#ffcf5c', 'เหลือง'], ['#ff9fb5', 'ชมพู'], ['#8fd3c1', 'มิ้นต์'], ['#9db8ff', 'ฟ้า'], ['#c9b6ff', 'ม่วง'], ['#ff9a76', 'พีช'], ['#7d8fe0', 'น้ำเงิน']];
  const LOOK_KEY = 'tiny-office-look';
  let look = { gender: 'girl', hairColor: '#5b3a2f', hairStyle: 'bun', outfit: 'hoodie', outfitColor: '#ffcf5c' };
  try { const saved = JSON.parse(localStorage.getItem(LOOK_KEY) || 'null'); if (saved) look = Object.assign(look, saved); } catch (e) {}
  if (!HAIR_STYLES[look.gender]) look.gender = 'girl';
  function syncGender() {
    const list = HAIR_STYLES[look.gender];
    if (!list.some(([v]) => v === look.hairStyle)) look.hairStyle = list[0][0];
    fillOptions('hairStyles', 'hairStyle', list, false);
  }
  function applyLook() {
    hairM.color.set(look.hairColor);
    const boy = look.gender === 'boy';
    lashMeshes.forEach(l => l.visible = !boy);
    browG.visible = boy;
    blushM.opacity = boy ? 0.3 : 0.55;
    bangsG.visible = look.hairStyle !== 'curtain';
    Object.entries(hairGroups).forEach(([k, g]) => g.visible = k === look.hairStyle);
    Object.entries(outfitGroups).forEach(([k, g]) => g.visible = k === look.outfit);
    garmentM.color.set(look.outfitColor);
    hoodie.color.set(look.outfit === 'shirt' ? '#f4f7ff' : look.outfit === 'overall' ? '#fff3e2' : look.outfitColor);
    pants.color.set(look.outfit === 'overall' ? look.outfitColor : look.outfit === 'shirt' ? '#5d6488' : '#7d8fe0');
    if (look.outfit === 'overall' && look.outfitColor === '#7d8fe0') pants.color.set('#6c7fd4');
    document.querySelectorAll('[data-look]').forEach(b => b.setAttribute('aria-pressed', String(look[b.dataset.look] === b.dataset.value)));
    try { localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch (e) {}
  }
  function fillOptions(id, key, list, swatch) {
    const box = document.getElementById(id);
    box.textContent = '';
    list.forEach(([value, name]) => {
      const b = document.createElement('button'); b.type = 'button';
      b.dataset.look = key; b.dataset.value = value;
      if (swatch) { b.className = 'sw'; b.style.background = value; b.setAttribute('aria-label', name); b.title = name; }
      else { b.className = 'opt'; b.textContent = name; }
      b.addEventListener('click', () => {
        if (look[key] === value) return;
        look[key] = value;
        if (key === 'gender') syncGender();
        applyLook(); celebrate(key === 'gender');
      });
      box.appendChild(b);
    });
  }
  fillOptions('gender', 'gender', GENDERS, false);
  fillOptions('hairColors', 'hairColor', HAIR_COLORS, true);
  syncGender();
  fillOptions('outfits', 'outfit', OUTFITS, false);
  fillOptions('outfitColors', 'outfitColor', OUTFIT_COLORS, true);
  applyLook();
  const pickOne = list => list[Math.floor(Math.random() * list.length)][0];
  document.getElementById('shuffle').addEventListener('click', () => {
    const gender = pickOne(GENDERS);
    look = { gender, hairColor: pickOne(HAIR_COLORS), hairStyle: pickOne(HAIR_STYLES[gender]), outfit: pickOne(OUTFITS), outfitColor: pickOne(OUTFIT_COLORS) };
    syncGender(); applyLook(); celebrate(true);
  });
  let lookLine = 0, lastCelebrate = 0;
  function celebrate(force) {
    const t = clock.getElapsedTime();
    if (!force && t - lastCelebrate < 0.6) return;
    lastCelebrate = t;
    head.getWorldPosition(anchorPos); burst(anchorPos.clone().add(new THREE.Vector3(0, 0.6, 0)), 4);
    const ll = LINES[look.gender].look;
    say(ll[lookLine++ % ll.length], head);
  }
  const closet = document.getElementById('closet'), btnCloset = document.getElementById('btnCloset');
  function toggleCloset(open) {
    closet.hidden = !open; btnCloset.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('closet-open', open);
    if (open) closet.querySelector('button[aria-pressed="true"]')?.focus({ preventScroll: true });
  }
  btnCloset.addEventListener('click', () => toggleCloset(closet.hidden));
  document.getElementById('closetClose').addEventListener('click', () => { toggleCloset(false); btnCloset.focus(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !closet.hidden) { toggleCloset(false); btnCloset.focus(); } });

  /* ---------- camera tween ---------- */
  let camTween = null;
  function flyTo(to, dur = 1.2, toT = TARGET) { camTween = { from: camera.position.clone(), to: to.clone(), fromT: controls.target.clone(), toT: toT.clone(), t: 0, dur }; }
  if (!calm) flyTo(HOME, 1.8); else camera.position.copy(HOME);
  document.getElementById('btnReset').addEventListener('click', () => { focused = false; flyTo(HOME, 1); emit('reset'); });

  /* idle sway */
  let lastInteract = -10;
  controls.addEventListener('start', () => { lastInteract = clock.getElapsedTime(); camTween = null; });

  /* ---------- clicks ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects([kid, chair, cat, lap, phone, shelf, cork, tv], true)[0];
    if (!hit) return null;
    for (let o = hit.object; o; o = o.parent) {
      if (o === kid || o === chair) return 'kid';
      if (o === cat) return 'cat';
      if (o === lap) return 'gmail';
      if (o === phone) return 'line';
      if (o === shelf) return 'onedrive';
      if (o === cork) return 'news';
      if (o === tv) return 'youtube';
    }
    return null;
  }
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', e => {
    if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
    if (moved > 6) return;
    const who = pick(e);
    if (who === 'kid') pokeKid(); else if (who === 'cat') pokeCat(); else if (who) emit('pick', who);
  });
  canvas.addEventListener('pointermove', e => { if (e.buttons) return; const who = pick(e); canvas.style.cursor = who ? 'pointer' : 'grab'; emit('hover', who); });
  canvas.addEventListener('pointerleave', () => emit('hover', null));
  canvas.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pokeKid(); } });

  const catLines = ['เมี้ยว~', 'อย่ากวนเค้าสิ', 'ง่วงงง...', 'ขอขนมหน่อย'];
  let kidJump = -1, catAwake = 0, li = 0, ci = 0;
  const bubble = document.getElementById('bubble');
  let bubbleAnchor = null, bubbleUntil = 0;
  const anchorPos = new THREE.Vector3();
  function say(text, anchor) { bubble.textContent = text; bubbleAnchor = anchor; bubbleUntil = clock.getElapsedTime() + 2.4; bubble.classList.add('show'); }
  function pokeKid() {
    if (kidJump >= 0) return;
    kidJump = 0;
    head.getWorldPosition(anchorPos); burst(anchorPos.clone().add(new THREE.Vector3(0, 0.6, 0)), 7);
    const kl = LINES[look.gender].poke;
    const custom = hub.kidLine && li % 2 === 0 ? hub.kidLine(look.gender) : null;
    say(custom || kl[li % kl.length], head); li++;
  }
  function pokeCat() {
    catAwake = 2.6;
    catHead.getWorldPosition(anchorPos); burst(anchorPos.clone().add(new THREE.Vector3(0, 0.35, 0)), 5);
    say(catLines[ci++ % catLines.length], catHead);
  }

  /* ---------- resize ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const base = 32 * Math.PI / 180;
    camera.fov = camera.aspect < 0.95 ? 2 * Math.atan(Math.tan(base / 2) * 0.95 / camera.aspect) * 180 / Math.PI : 32;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize); resize();

  /* ---------- loop ---------- */
  const clock = new THREE.Clock();
  const chip = document.getElementById('chip');
  let screenAcc = 0, lastChip = '';
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const handTarget = new THREE.Vector3();
  let blinkAt = 2;

  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    const motion = calm ? 0.25 : 1;

    night += (nightTarget - night) * Math.min(1, dt * 3);
    applyNight(night);

    if (camTween) {
      camTween.t += dt / camTween.dur;
      const p = easeInOut(Math.min(1, camTween.t));
      camera.position.lerpVectors(camTween.from, camTween.to, p);
      controls.target.lerpVectors(camTween.fromT, camTween.toT, p);
      if (camTween.t >= 1) camTween = null;
    }
    shiftX += (shiftTX - shiftX) * Math.min(1, dt * 6);
    shiftY += (shiftTY - shiftY) * Math.min(1, dt * 6);
    if (Math.abs(shiftX) > 0.5 || Math.abs(shiftY) > 0.5) camera.setViewOffset(canvas.clientWidth, canvas.clientHeight, shiftX, shiftY, canvas.clientWidth, canvas.clientHeight);
    else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    controls.autoRotate = !calm && !camTween && !focused && t - lastInteract > 6;
    if (controls.autoRotate) {
      const az = controls.getAzimuthalAngle();
      if (az > 1.15 && controls.autoRotateSpeed < 0) controls.autoRotateSpeed *= -1;
      if (az < 0.42 && controls.autoRotateSpeed > 0) controls.autoRotateSpeed *= -1;
    }
    controls.update();

    /* girl: breathing, head sway, typing, blinking, jumping */
    torso.scale.y = 1 + Math.sin(t * 2.2) * 0.015 * motion;
    head.rotation.z = Math.sin(t * 1.1) * 0.06 * motion;
    head.rotation.x = Math.sin(t * 0.7) * 0.03 * motion;
    let jw = 0;
    if (kidJump >= 0) { kidJump += dt / 0.9; jw = Math.sin(Math.min(1, kidJump) * Math.PI); body.position.y = jw * 0.32; if (kidJump >= 1) { kidJump = -1; body.position.y = 0; } }
    arms.forEach(a => {
      handTarget.copy(a.rest); handTarget.y += Math.max(0, Math.sin(t * 13 + a.s * 1.7)) * 0.05 * motion;
      handTarget.lerp(a.raised, jw); aimArm(a, handTarget);
    });
    if (t > blinkAt) { const bt = t - blinkAt; const sc = bt < 0.14 ? 0.12 : 1; eyes.forEach(e => e.scale.y = sc); if (bt > 0.14) blinkAt = t + 2.5 + Math.random() * 3; }

    /* laptop code */
    if (kidJump < 0) typed += dt * 1.4;
    if (typed > codeLines.length + 2) typed = 0;
    screenAcc += dt; if (screenAcc > 0.12) { screenAcc = 0; drawScreen(Math.floor(t * 2) % 2 === 0); }

    /* steam */
    steam.forEach(s => { const p = (t * 0.45 + s.userData.phase) % 1; s.position.set(Math.sin(t * 2 + s.userData.phase * 6) * 0.03, 0.25 + p * 0.45, 0); s.scale.setScalar(0.07 + p * 0.14); s.material.opacity = Math.sin(p * Math.PI) * 0.55; });

    /* cat */
    catBody.scale.y = 0.72 * (1 + Math.sin(t * 1.8) * 0.045 * motion);
    if (catAwake > 0) catAwake -= dt;
    const awake = catAwake > 0;
    closedEyes.forEach(e => e.visible = !awake); openEyes.forEach(e => e.visible = awake);
    catHead.rotation.x += ((awake ? -0.28 : 0.05) - catHead.rotation.x) * Math.min(1, dt * 6);
    catHead.rotation.z += ((awake ? 0.18 : 0) - catHead.rotation.z) * Math.min(1, dt * 6);
    tail.rotation.z = 0.5 + Math.sin(t * (awake ? 9 : 1.2)) * (awake ? 0.22 : 0.06) * motion;
    zzz.forEach(s => { const p = (t * 0.3 + s.userData.phase) % 1; s.position.set(0.25 + p * 0.25, 0.75 + p * 0.6, 0.3); s.scale.setScalar(0.1 + p * 0.12); s.material.opacity = awake ? 0 : Math.sin(p * Math.PI) * 0.9; });

    /* hearts */
    hearts.forEach(h => {
      if (!h.visible) return; const u = h.userData; u.t += dt;
      const p = u.t / u.life;
      h.position.x += u.vx * dt; h.position.z += u.vz * dt; h.position.y += u.vy * dt; u.vy *= 0.985;
      h.scale.setScalar(u.s * (p < 0.15 ? p / 0.15 : 1)); h.material.opacity = p > 0.6 ? (1 - p) / 0.4 : 1;
      if (p >= 1) { h.visible = false; h.material.opacity = 0; }
    });

    /* real-time clock */
    const now = new Date(), hh = now.getHours(), mm = now.getMinutes(), ss = now.getSeconds() + now.getMilliseconds() / 1000;
    secHand.rotation.z = -ss / 60 * Math.PI * 2;
    minHand.rotation.z = -(mm + ss / 60) / 60 * Math.PI * 2;
    hourHand.rotation.z = -((hh % 12) + mm / 60) / 12 * Math.PI * 2;
    const label = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    if (label !== lastChip) { chip.textContent = label; lastChip = label; }

    /* speech bubble follows its anchor */
    if (bubbleAnchor) {
      if (t > bubbleUntil) { bubble.classList.remove('show'); bubbleAnchor = null; }
      else {
        bubbleAnchor.getWorldPosition(anchorPos); anchorPos.y += bubbleAnchor === head ? 0.95 : 0.55;
        anchorPos.project(camera);
        const r = canvas.getBoundingClientRect();
        const x = (anchorPos.x * 0.5 + 0.5) * r.width + r.left, y = (-anchorPos.y * 0.5 + 0.5) * r.height + r.top;
        bubble.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      }
    }

    if (tvVideo) tvVideo.p = (tvVideo.p + dt / tvVideo.len) % 1;
    tvAcc += dt; if (tvVideo && tvAcc > 0.12) { tvAcc = 0; drawTV(); }

    renderer.render(scene, camera);
    emit('frame');
    requestAnimationFrame(tick);
  }
  /* ---------- API for app.js ---------- */
  let focused = false, shiftX = 0, shiftY = 0, shiftTX = 0, shiftTY = 0;
  const HOTSPOTS = {
    gmail:    { obj: lap,   lift: 0.62, off: [-0.62, 0, 0.62], az: 0.78, el: 0.42, dist: 9.5 },
    line:     { obj: phone, lift: 0.6,  az: 0.9,  el: 0.4, dist: 8.5 },
    onedrive: { obj: shelf, lift: 3.0,  az: 1.2,  el: 0.4,  dist: 10, center: 1.3 },
    news:     { obj: cork,  lift: 0.55, az: 0.42, el: 0.36, dist: 9.5 },
    youtube:  { obj: tv,    lift: 0.12, off: [0, 0, 0.9], az: 1.2,  el: 0.34, dist: 9.5 }
  };
  const wp = new THREE.Vector3(), sp = new THREE.Vector3();
  function focusOn(name) {
    const h = HOTSPOTS[name];
    if (!h) { if (focused) { focused = false; flyTo(HOME, 1.1); } return; }
    h.obj.getWorldPosition(wp); if (h.center) wp.y += h.center;
    const dir = new THREE.Vector3(Math.sin(h.az) * Math.cos(h.el), Math.sin(h.el), Math.cos(h.az) * Math.cos(h.el));
    focused = true;
    flyTo(wp.clone().add(dir.multiplyScalar(h.dist)), 1.1, wp.clone());
  }
  function screenPos(name) {
    const h = HOTSPOTS[name]; if (!h) return null;
    h.obj.getWorldPosition(wp); wp.y += h.lift; if (h.off) { wp.x += h.off[0]; wp.z += h.off[2]; }
    sp.copy(wp).project(camera);
    const r = canvas.getBoundingClientRect();
    return { x: (sp.x * 0.5 + 0.5) * r.width + r.left, y: (-sp.y * 0.5 + 0.5) * r.height + r.top, visible: sp.z < 1 && Math.abs(sp.x) < 1.05 && Math.abs(sp.y) < 1.05 };
  }
  window.OfficeScene = {
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    say(text) { say(text, head); },
    focus: focusOn,
    setViewShift(x, y) { shiftTX = x; shiftTY = y; },
    screenPos,
    getLook: () => Object.assign({}, look),
    setKidLine(fn) { hub.kidLine = fn; },
    setPhoneUnread(n) { if (n !== phoneUnread) { phoneUnread = n; drawPhone(); } },
    playVideo(v) { tvVideo = v ? Object.assign({ len: 60 }, v, { p: 0 }) : null; drawTV(); },
    videoProgress: () => (tvVideo ? tvVideo.p : 0),
    celebrate(name) { const p = HOTSPOTS[name]; if (!p) return; p.obj.getWorldPosition(wp); wp.y += p.lift; burst(wp.clone(), 5); }
  };

  requestAnimationFrame(tick);
})();
