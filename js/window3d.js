/* Novin Profile — procedural 3D uPVC window (Three.js). No external models or textures:
   everything (frame mitres, double glazing, handle, wood grain, landscape) is generated here. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const FW = 1.30, FH = 1.70;           // outer frame size (units ≈ metres)
const OW = FW - 0.13, OH = FH - 0.13;        // opening of the frame's main ring
const SW = OW - 0.014, SH = OH - 0.014;      // sash outer size

/* ---------- small helpers ---------- */
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const seg = (p, a, b) => ease(Math.min(1, Math.max(0, (p - a) / (b - a))));
const canvas2d = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

/* ---------- procedural textures (cached, shared by all scenes) ---------- */
const cache = {};
function woodTexture(key, base, dark, light) {
  if (cache[key]) return cache[key];
  const [c, x] = canvas2d(512, 512);
  x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 380; i++) {
    const px = rnd() * 512, w = .6 + rnd() * 3.4, amp = 3 + rnd() * 12, f = .004 + rnd() * .012, ph = rnd() * 6.28;
    x.strokeStyle = rnd() < .56 ? dark : light; x.globalAlpha = .05 + rnd() * .24; x.lineWidth = w;
    x.beginPath();
    for (let y = -4; y <= 516; y += 8) { const xx = px + Math.sin(y * f + ph) * amp; y === -4 ? x.moveTo(xx, y) : x.lineTo(xx, y); }
    x.stroke();
  }
  x.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.repeat.set(1.6, 1.6);
  return (cache[key] = t);
}

function glassStreakTexture() {
  if (cache.streak) return cache.streak;
  const [c, x] = canvas2d(512, 512);
  x.fillStyle = '#0d0d0d'; x.fillRect(0, 0, 512, 512);
  x.save(); x.translate(256, 256); x.rotate(-0.62);
  const band = (off, w, a) => { const g = x.createLinearGradient(off - w, 0, off + w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(off - w, -600, w * 2, 1200); };
  band(-170, 46, .6); band(-60, 14, .5); band(110, 70, .3); band(240, 16, .4);
  x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (cache.streak = t);
}

function skyTexture() {
  if (cache.sky) return cache.sky;
  const [c, x] = canvas2d(1024, 768);
  const g = x.createLinearGradient(0, 0, 0, 768);
  [[0, '#2a78cf'], [.26, '#4f9fe3'], [.44, '#9ccff2'], [.55, '#f9e8cc'], [.60, '#ffe0b0'], [1, '#ffd29a']].forEach(s => g.addColorStop(s[0], s[1]));
  x.fillStyle = g; x.fillRect(0, 0, 1024, 768);
  const sx = 585, sy = 330;
  [[420, .22], [230, .35], [110, .75], [38, 1]].forEach(([r, a]) => {
    const rg = x.createRadialGradient(sx, sy, 0, sx, sy, r);
    rg.addColorStop(0, `rgba(255,248,224,${a})`); rg.addColorStop(1, 'rgba(255,240,200,0)');
    x.fillStyle = rg; x.fillRect(0, 0, 1024, 768);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (cache.sky = t);
}

function hillTexture(key, { top, bottom, haze, amp, base, trees, treeCol, seedOff }) {
  if (cache[key]) return cache[key];
  const W = 2048, H = 1024; const [c, x] = canvas2d(W, H);
  const P = [seedOff, seedOff * 1.7, seedOff * 2.3];
  const ridge = u => base + amp * (Math.sin(u * 2 * Math.PI / 760 + P[0]) * .55 + Math.sin(u * 2 * Math.PI / 290 + P[1]) * .3 + Math.sin(u * 2 * Math.PI / 115 + P[2]) * .15);
  const g = x.createLinearGradient(0, base - amp, 0, H);
  g.addColorStop(0, top); g.addColorStop(.35, bottom); g.addColorStop(1, bottom);
  x.fillStyle = g; x.beginPath(); x.moveTo(0, H);
  for (let u = 0; u <= W; u += 4) x.lineTo(u, ridge(u));
  x.lineTo(W, H); x.closePath(); x.fill();
  if (trees) {
    for (let i = 0; i < 520; i++) {
      const u = rnd() * W, r = trees * (.5 + rnd() * .9), y = ridge(u) + rnd() * trees * 3.2 + 2;
      x.fillStyle = treeCol[Math.floor(rnd() * treeCol.length)]; x.globalAlpha = .9;
      x.beginPath(); x.ellipse(u, y - r * .5, r * .8, r, 0, 0, 6.3); x.fill();
    }
    x.globalAlpha = 1;
  }
  if (haze) { // mist at the foot of the layer
    const hg = x.createLinearGradient(0, base - amp, 0, base + 180);
    hg.addColorStop(0, 'rgba(255,230,190,0)'); hg.addColorStop(1, haze);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = hg; x.fillRect(0, base - amp, W, 400); x.globalCompositeOperation = 'source-over';
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (cache[key] = t);
}

function cloudTexture() {
  if (cache.cloud) return cache.cloud;
  const W = 2048, H = 512; const [c, x] = canvas2d(W, H);
  const blob = (cx, cy, r, a) => {
    for (const ox of [-W, 0, W]) { const g = x.createRadialGradient(cx + ox, cy, 0, cx + ox, cy, r);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(.6, `rgba(255,255,255,${a * .45})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(cx + ox - r, cy - r, r * 2, r * 2); }
  };
  for (let i = 0; i < 9; i++) {
    const cx = (i + .2 + rnd() * .6) * (W / 9), cy = 140 + rnd() * 220, n = 6 + Math.floor(rnd() * 5), sz = 50 + rnd() * 60;
    for (let k = 0; k < n; k++) blob(cx + (k - n / 2) * sz * .7 + rnd() * 30, cy + (rnd() - .5) * sz * .5, sz * (.8 + rnd() * .7), .5 + rnd() * .3);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace;
  return (cache.cloud = t);
}

/* ---------- environment map for PBR reflections (sky + sun + soft box) ---------- */
export function createEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec3 vP; void main(){ float h = vP.y;
      vec3 top = vec3(.30,.55,.95)*1.3, hor = vec3(1.,.92,.80)*1.7, gnd = vec3(.20,.17,.15);
      vec3 c = h>0. ? mix(hor, top, pow(h,.55)) : mix(hor*.5, gnd, pow(-h,.4));
      gl_FragColor = vec4(c,1.); }`
  }));
  s.add(sky);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 12, 9) }));
  sun.position.set(22, 20, -36); s.add(sun);
  const box = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: new THREE.Color(5, 5, 5.2), side: THREE.DoubleSide }));
  box.position.set(-14, 17, 20); box.lookAt(0, 0, 0); s.add(box);
  const rt = pm.fromScene(s, 0.02);
  pm.dispose(); sky.geometry.dispose();
  return rt.texture;
}

/* ---------- landscape seen through the window ---------- */
export function createBackdrop() {
  const g = new THREE.Group();
  const mk = (map, w, h, z, ro) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.z = z; m.renderOrder = ro; g.add(m); return m;
  };
  const sky = mk(skyTexture(), 22, 16.5, -17, 0);
  const sunGlow = null;
  const clouds = mk(cloudTexture(), 13, 3.25, -12, 1);
  const layers = [
    { z: -10, yT: -.10, w: 16, h: 8, ro: 2, tex: hillTexture('far', { top: '#a9c9d6', bottom: '#9fc0c9', haze: 'rgba(255,226,186,.85)', amp: 58, base: 470, trees: 0, seedOff: 1.1 }) },
    { z: -6.5, yT: -.28, w: 14, h: 7, ro: 3, tex: hillTexture('mid', { top: '#7fb08f', bottom: '#5f9a78', haze: 'rgba(235,235,200,.55)', amp: 64, base: 480, trees: 4.5, treeCol: ['#5d9a73', '#4f8c68', '#6aa57c'], seedOff: 2.9 }) },
    { z: -3.6, yT: -.50, w: 12, h: 6, ro: 4, tex: hillTexture('near', { top: '#4e9a5c', bottom: '#2f7345', haze: null, amp: 54, base: 500, trees: 7, treeCol: ['#245f3a', '#2f7a46', '#1d5232', '#3a8a50'], seedOff: 4.4 }) },
  ].map(L => ({ ...L, mesh: mk(L.tex, L.w, L.h, L.z, L.ro) }));
  let d = 4.8;
  // sx, sy = camera offset; shifting each layer by s·(1 − D/d) keeps the view through the window centred
  const place = (dd, sx = 0, sy = 0) => {
    d = dd;
    const sh = z => { const D = d - z, k = 1 - D / d; return [sx * k, sy * k, D]; };
    layers.forEach(L => { const [ox, oy, D] = sh(L.z); L.mesh.position.set(ox, L.yT * D / d + oy, L.z); });
    let [ox, oy] = sh(-17); sky.position.set(ox, oy + .05, -17);
    [ox, oy] = sh(-12); clouds.position.set(ox, oy + 1.5 * (d + 12) / d * .62, -12);
  };
  place(d);
  g.userData = { place, update: (dt, drift) => { if (drift) cache.cloud.offset.x += dt * 0.0016; } };
  return g;
}

/* ---------- the window ---------- */
function ringGeo(w, h, b, depth, z0, bevel = .004) {
  const parts = [];
  const sides = [
    { p: [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - b, -h / 2 + b], [-w / 2 + b, -h / 2 + b]], horiz: true },
    { p: [[-w / 2, h / 2], [w / 2, h / 2], [w / 2 - b, h / 2 - b], [-w / 2 + b, h / 2 - b]], horiz: true },
    { p: [[-w / 2, -h / 2], [-w / 2 + b, -h / 2 + b], [-w / 2 + b, h / 2 - b], [-w / 2, h / 2]], horiz: false },
    { p: [[w / 2, -h / 2], [w / 2, h / 2], [w / 2 - b, h / 2 - b], [w / 2 - b, -h / 2 + b]], horiz: false },
  ];
  for (const s of sides) {
    const sh = new THREE.Shape(); s.p.forEach((q, i) => i ? sh.lineTo(q[0], q[1]) : sh.moveTo(q[0], q[1]));
    const g = new THREE.ExtrudeGeometry(sh, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .7, bevelSegments: 2, curveSegments: 1 });
    g.translate(0, 0, z0 + bevel);
    if (s.horiz) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, u); } }
    parts.push(g);
  }
  return mergeGeometries(parts);
}

export const FINISHES = {
  white:      { name: 'سفید یخی',      color: 0xf2f4f5, roughness: .42, clearcoat: .3 },
  anthracite: { name: 'طوسی آنتراسیت', color: 0x353b41, roughness: .5,  clearcoat: .2 },
  oak:        { name: 'بلوط طلایی',    color: 0xffffff, roughness: .5,  clearcoat: .15, wood: ['oak', '#c4863a', '#7d4c18', '#e6b66c'] },
  walnut:     { name: 'گردوی تیره',    color: 0xffffff, roughness: .5,  clearcoat: .15, wood: ['walnut', '#573420', '#25130a', '#7d4e32'] },
};

export function createWindow(opts = {}) {
  const root = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xf2f4f5, roughness: .42, clearcoat: .3, clearcoatRoughness: .35, envMapIntensity: .75 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101316, roughness: .75 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xdfe3e6, metalness: 1, roughness: .22, envMapIntensity: 1.5 });
  const spacerMat = new THREE.MeshStandardMaterial({ color: 0xaab3ba, metalness: .85, roughness: .38, envMapIntensity: 1.2 });
  const shadowOn = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // frame: main ring + front lip (exterior stop) + black gasket
  root.add(shadowOn(new THREE.Mesh(mergeGeometries([ringGeo(FW, FH, .065, .075, -.01), ringGeo(FW, FH, .105, .055, -.065)]), mat)));
  root.add(new THREE.Mesh(ringGeo(OW, OH, .022, .01, -.012, .002), dark));

  // sash pivot sits at the bottom-left corner so it can swing on its hinge (rotation.y) or tilt (rotation.x)
  const pivot = new THREE.Group(); pivot.position.set(-SW / 2, -SH / 2, 0); root.add(pivot);
  const body = new THREE.Group(); body.position.set(SW / 2, SH / 2, 0); pivot.add(body);
  body.add(shadowOn(new THREE.Mesh(mergeGeometries([ringGeo(SW, SH, .078, .05, 0), ringGeo(SW, SH, .092, .022, .05, .003)]), mat)));

  // double glazing: two panes, aluminium spacer, tint + animated-looking reflection streaks
  const GW = SW - .12, GH = SH - .12;
  const spacer = new THREE.Mesh(ringGeo(GW - .008, GH - .008, .045, .022, .013, .002), spacerMat); body.add(spacer);
  const tintMat = new THREE.MeshBasicMaterial({ color: 0x9fd2e0, transparent: true, opacity: .075, depthWrite: false });
  const refl = new THREE.MeshBasicMaterial({ map: glassStreakTexture(), transparent: true, opacity: .34, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, color: 0xffffff });
  const reflBack = refl.clone(); reflBack.opacity = .18; reflBack.map = glassStreakTexture().clone(); reflBack.map.needsUpdate = true; reflBack.map.offset.set(.18, -.1); reflBack.map.repeat.set(1.15, 1.15);
  const pane = (z, m, ro) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), m); p.position.z = z; p.renderOrder = ro; body.add(p); return p; };
  pane(.0125, tintMat, 20); pane(.0135, reflBack, 21);
  pane(.0355, tintMat, 22); const front = pane(.0365, refl, 23);
  refl.userData.front = front;

  // handle (rosette + spindle + lever); lever rotates around z
  const hx = SW / 2 - .046, hy = -.02;
  const rose = new THREE.Mesh(new RoundedBoxGeometry(.034, .13, .014, 3, .006), metal); rose.position.set(hx, hy, .079); body.add(shadowOn(rose));
  const lever = new THREE.Group(); lever.position.set(hx, hy, .09); body.add(lever);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(.019, .019, .02, 24), metal); hub.rotation.x = Math.PI / 2; lever.add(shadowOn(hub));
  const bar = new THREE.Mesh(new RoundedBoxGeometry(.026, .125, .02, 3, .009), metal); bar.position.set(0, -.052, .004); lever.add(shadowOn(bar));

  // hinges (static, on the frame)
  [-.52, .55].forEach(y => {
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.011, .011, .1, 16), metal); h.position.set(-SW / 2 - .003, y, .052); root.add(h);
    const pl = new THREE.Mesh(new RoundedBoxGeometry(.05, .09, .008, 2, .003), metal); pl.position.set(-SW / 2 - .02, y, .067); root.add(pl);
  });

  const api = {
    root, pivot, lever, frameMat: mat, refl,
    setFinish(key) {
      const f = FINISHES[key]; if (!f) return;
      mat.color.setHex(f.color); mat.roughness = f.roughness; mat.clearcoat = f.clearcoat;
      mat.map = f.wood ? woodTexture(...f.wood) : null; mat.needsUpdate = true;
    },
    /* hinge/tilt in radians, handle 0 (down) → 1 (side) → 2 (up) */
    setState({ hinge = 0, tilt = 0, handle = 0 }) {
      pivot.rotation.set(tilt, -hinge, 0);
      lever.rotation.z = -handle * Math.PI / 2;
    },
  };
  api.setFinish(opts.finish || 'white');
  return api;
}

/* sash state for hero scroll progress p ∈ [0,1] */
export const HINGE_MAX = 64 * Math.PI / 180, TILT_MAX = 13 * Math.PI / 180;
export function stateAt(p) {
  const handle = seg(p, 0, .07) + seg(p, .72, .80);
  const hinge = HINGE_MAX * (seg(p, .07, .45) - seg(p, .55, .72));
  const tilt = TILT_MAX * seg(p, .80, 1);
  const mode = p < .06 ? 0 : p < .74 ? 1 : 2;
  return { hinge, tilt, handle, mode, open: Math.max(hinge / HINGE_MAX, tilt / TILT_MAX * .6) };
}

/* ---------- shared renderer setup ---------- */
function makeRenderer(canvas, { mobile, reduce, alpha = false }) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(Math.min(window.devicePixelRatio || 1, reduce ? 1.25 : mobile ? 1.5 : 2));
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
  r.shadowMap.enabled = !reduce; r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

/* ---------- HERO: window in a wall, driven by scroll progress ---------- */
export function createHero(canvas, { mobile, reduce, onState }) {
  const renderer = makeRenderer(canvas, { mobile, reduce });
  renderer.setClearColor(0x0f1a25);
  const scene = new THREE.Scene();
  scene.environment = createEnv(renderer);
  scene.environmentIntensity = .9;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);
  const FOV = Math.tan(THREE.MathUtils.degToRad(15));

  const win = createWindow(); scene.add(win.root);
  const backdrop = createBackdrop(); scene.add(backdrop);

  // wall with a rectangular reveal (hole) the size of the frame
  const wallShape = new THREE.Shape(); wallShape.moveTo(-9, -6); wallShape.lineTo(9, -6); wallShape.lineTo(9, 6); wallShape.lineTo(-9, 6); wallShape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-FW / 2, -FH / 2); hole.lineTo(-FW / 2, FH / 2); hole.lineTo(FW / 2, FH / 2); hole.lineTo(FW / 2, -FH / 2); hole.closePath();
  wallShape.holes.push(hole);
  const wallGeo = new THREE.ExtrudeGeometry(wallShape, { depth: .32, bevelEnabled: false }); wallGeo.translate(0, 0, -.12);
  const wall = new THREE.Mesh(wallGeo, new THREE.MeshStandardMaterial({ color: 0x33444f, roughness: .95, envMapIntensity: .25 }));
  wall.receiveShadow = true; wall.castShadow = true; scene.add(wall);
  const sill = new THREE.Mesh(new RoundedBoxGeometry(FW + .34, .04, .34, 3, .012), new THREE.MeshPhysicalMaterial({ color: 0xf0f2f3, roughness: .45, clearcoat: .25 }));
  sill.position.set(0, -FH / 2 - .0, .17); sill.receiveShadow = true; sill.castShadow = true; scene.add(sill);

  // lights: soft key from front-left (casts the sash shadow on the wall), warm light that floods in as the window opens
  scene.add(new THREE.HemisphereLight(0x9db8d0, 0x222a31, .55));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.9); key.position.set(-3.2, 3.4, 4.2); key.target.position.set(0, 0, 0);
  key.castShadow = !reduce; key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 12 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 4;
  scene.add(key, key.target);
  const glow = new THREE.PointLight(0xffd9a0, 0, 7, 1.6); glow.position.set(.2, -.2, 1.6); scene.add(glow);

  let target = 0, cur = 0, running = false, raf = 0, last = 0, d = 4.8, sx = 0, sy = 0, px = 0, py = 0, tpx = 0, tpy = 0, dirty = true;
  let hero_ready; const ready = new Promise(r => (hero_ready = r));

  function layout() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1, aspect = w / h;
    renderer.setSize(w, h, false); camera.aspect = aspect; 
    const wide = aspect > 1.05;
    let dH, dW;
    if (wide) { dH = FH / (.70 * 2 * FOV); dW = FW / (.40 * 2 * FOV * aspect); }
    else { dH = FH / (.43 * 2 * FOV); dW = FW / (.74 * 2 * FOV * aspect); }
    d = Math.max(dH, dW);
    const visW = 2 * FOV * d * aspect, visH = 2 * FOV * d;
    sx = wide ? .36 * visW / 2 : 0;           // window slides to the left so Persian text sits on the right
    sy = wide ? 0 : .27 * visH / 2;           // …or lower on portrait screens, text on top
    camera.updateProjectionMatrix(); backdrop.userData.place(d, sx, sy); dirty = true;
  }

  function frame(now) {
    raf = running ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const k = 1 - Math.exp(-dt * (reduce ? 14 : 9));
    const prev = cur; cur += (target - cur) * k; if (Math.abs(target - cur) < 1e-4) cur = target;
    px += (tpx - px) * (1 - Math.exp(-dt * 3)); py += (tpy - py) * (1 - Math.exp(-dt * 3));
    backdrop.userData.update(dt, !reduce);
    const s = stateAt(cur);
    win.setState(s);
    glow.intensity = 9 * s.open;
    camera.position.set(sx + px * .14, sy + py * .08, d * (1 - .05 * s.open));
    camera.lookAt(sx, sy, 0);
    renderer.render(scene, camera);
    onState && onState(s, cur);
    if (hero_ready) { hero_ready(); hero_ready = null; document.documentElement.dataset.heroReady = '1'; }
  }

  const ro = new ResizeObserver(layout); ro.observe(canvas);
  if (!reduce) window.addEventListener('pointermove', e => { tpx = (e.clientX / innerWidth - .5) * 2; tpy = -(e.clientY / innerHeight - .5) * 2; }, { passive: true });
  layout();
  window.__novin = { get p() { return cur; }, get target() { return target; } };
  return {
    ready,
    setProgress(p) { target = p; },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { frame(performance.now()); },
    layout,
  };
}

/* ---------- PICKER: free-standing window you can drag, recolour and open ---------- */
export function createPicker(canvas, { mobile, reduce }) {
  const renderer = makeRenderer(canvas, { mobile, reduce });
  renderer.shadowMap.enabled = false;
  const scene = new THREE.Scene();
  scene.environment = createEnv(renderer); scene.environmentIntensity = 1;
  const camera = new THREE.PerspectiveCamera(28, 1, .1, 80);
  const FOV = Math.tan(THREE.MathUtils.degToRad(14));
  const backdrop = createBackdrop(); scene.add(backdrop);
  const win = createWindow({ finish: 'white' }); const holder = new THREE.Group(); holder.add(win.root); scene.add(holder);
  scene.add(new THREE.HemisphereLight(0xbcd2e6, 0x403a33, .7));
  const key = new THREE.DirectionalLight(0xfff0da, 2.1); key.position.set(-3, 3, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfdcff, .8); rim.position.set(4, 1, -2); scene.add(rim);

  let yaw = -.55, targetYaw = -.55, openT = 0, open = 0, running = false, raf = 0, last = 0, drag = null, idle = 0, d = 5;
  function layout() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1, a = w / h;
    renderer.setSize(w, h, false); camera.aspect = a; camera.updateProjectionMatrix();
    d = Math.max(FH / (.78 * 2 * FOV), FW * 1.5 / (.9 * 2 * FOV * a)); backdrop.userData.place(d);
  }
  function frame(now) {
    raf = running ? requestAnimationFrame(frame) : 0;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    if (!drag) { idle += dt; if (!reduce) targetYaw = -.5 + Math.sin(idle * .5) * .28; }
    yaw += (targetYaw - yaw) * (1 - Math.exp(-dt * 7));
    open += (openT - open) * (1 - Math.exp(-dt * 5));
    holder.rotation.y = yaw;
    win.setState({ hinge: open * 52 * Math.PI / 180, handle: open });
    backdrop.userData.update(dt, !reduce);
    camera.position.set(0, .05, d); camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw: targetYaw }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', e => { if (drag) targetYaw = Math.max(-1.1, Math.min(1.1, drag.yaw + (e.clientX - drag.x) * .008)); });
  const end = () => { drag = null; idle = 0; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  new ResizeObserver(layout).observe(canvas); layout();
  return {
    setFinish: k => win.setFinish(k),
    toggleOpen() { openT = openT ? 0 : 1; return !!openT; },
    start() { if (!running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    renderOnce() { frame(performance.now()); },
  };
}
