import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MeshoptDecoder } from 'meshoptimizer/decoder';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { TOUR } from './tour.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// ────────────────────────────────────────────────────────────── icons
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeoff: '<path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.4 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 8 10 8a9.7 9.7 0 0 0 5.4-1.6"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><path d="m2 2 20 20"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chev: '<path d="m9 6 6 6-6 6"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  focus: '<path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3"/>',
  isolate: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z"/><path d="M12 21.5V12M20.5 7 12 12 3.5 7"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".6" fill="currentColor"/><circle cx="4.5" cy="12" r=".6" fill="currentColor"/><circle cx="4.5" cy="18" r=".6" fill="currentColor"/>',
  explode: '<rect x="9" y="9" width="6" height="6" rx="1"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M9.8 4.2 12 2l2.2 2.2M9.8 19.8 12 22l2.2-2.2M4.2 9.8 2 12l2.2 2.2M19.8 9.8 22 12l-2.2 2.2"/>',
  section: '<path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z"/><path d="M2 13.5 22 9.5" stroke-dasharray="2.2 2.2"/>',
  xray: '<rect x="3" y="3" width="13" height="13" rx="2.5"/><rect x="8" y="8" width="13" height="13" rx="2.5" stroke-dasharray="2.4 2.2"/>',
  rotate: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v5h-5"/>',
  play: '<path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.3-7.2a.8.8 0 0 0 0-1.4L8.2 4.1a.8.8 0 0 0-1.2.7Z" fill="currentColor" stroke="none"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7Z"/>',
  camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H7l1.6-2.4a1.3 1.3 0 0 1 1.1-.6h4.6a1.3 1.3 0 0 1 1.1.6L17 6h1.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"/><circle cx="12" cy="13" r="3.5"/>',
  expand: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.2 9.2a2.9 2.9 0 0 1 5.6 1c0 1.9-2.8 2.7-2.8 2.7M12 17h.01"/>',
  collapse: '<path d="m7 20 5-5 5 5M7 4l5 5 5-5"/>',
  flip: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
};
const icon = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => {
    if (el.dataset.hydrated) return;
    el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon));
    el.dataset.hydrated = '1';
  });
}
function setIcon(el, name) { el.dataset.icon = name; const s = el.querySelector('svg'); if (s) s.outerHTML = icon(name); }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (n) => n.toLocaleString('en-US');
const fmtMM = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
const sleep = () => new Promise((r) => setTimeout(r, 0));

// ────────────────────────────────────────────────────────────── renderer / scene
const app = $('#app');
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 1, 10000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.09;
controls.zoomToCursor = true;
controls.screenSpacePanning = true;
controls.autoRotateSpeed = 0.9;
controls.rotateSpeed = 0.85;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;
scene.environmentRotation.y = Math.PI * 0.2;

const hemi = new THREE.HemisphereLight(0xffffff, 0x404650, 0.35);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 1.55);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 14;
key.shadow.blurSamples = 20;
key.shadow.bias = -0.0004;
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0xcfe0ff, 0.55);
scene.add(rim, rim.target);

const viewRoot = new THREE.Group();   // presentation orientation (front of robot faces +Z)
viewRoot.rotation.y = -Math.PI / 4;
const cadRoot = new THREE.Group();    // STEP coordinates (Z-up, mm)
cadRoot.rotation.x = -Math.PI / 2;
viewRoot.add(cadRoot);
scene.add(viewRoot);

const composerTarget = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, composerTarget);
composer.addPass(new RenderPass(scene, camera));
const gtao = new GTAOPass(scene, camera, 1, 1);
gtao.output = GTAOPass.OUTPUT.Default;
gtao.blendIntensity = 1.0;
composer.addPass(gtao);
composer.addPass(new OutputPass());

// ────────────────────────────────────────────────────────────── theme / backdrop
const THEMES = {
  dark: { center: '#2b3039', mid: '#171a20', edge: '#0a0c0f', grid: 'rgba(255,255,255,', gridA: 0.11, shadow: 0.55, ghost: '#9fb4cc', ghostOp: 0.1, hemi: 0.35, env: 0.85 },
  light: { center: '#ffffff', mid: '#eef1f4', edge: '#cfd5dc', grid: 'rgba(20,30,45,', gridA: 0.14, shadow: 0.26, ghost: '#6f8196', ghostOp: 0.11, hemi: 0.5, env: 0.95 },
};
let theme = 'dark';
function makeBackdrop(t) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(512, 430, 20, 512, 512, 760);
  grd.addColorStop(0, t.center); grd.addColorStop(0.45, t.mid); grd.addColorStop(1, t.edge);
  g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
  // fine noise to avoid banding
  const img = g.getImageData(0, 0, 1024, 1024); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 3; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeGridTexture(t) {
  const S = 2048, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); const R = S / 2;
  g.translate(R, R);
  for (let i = 1; i <= 16; i++) {
    const r = (i / 16) * R * 0.98;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
    g.strokeStyle = t.grid + (i % 4 === 0 ? t.gridA * 1.4 : t.gridA * 0.6) + ')';
    g.lineWidth = i % 4 === 0 ? 2.2 : 1.3; g.stroke();
  }
  for (let a = 0; a < 24; a++) {
    const th = (a / 24) * Math.PI * 2;
    g.beginPath(); g.moveTo(Math.cos(th) * R * 0.0625, Math.sin(th) * R * 0.0625); g.lineTo(Math.cos(th) * R * 0.98, Math.sin(th) * R * 0.98);
    g.strokeStyle = t.grid + t.gridA * (a % 6 === 0 ? 1.1 : 0.45) + ')'; g.lineWidth = 1.2; g.stroke();
  }
  // radial fade
  g.globalCompositeOperation = 'destination-in';
  const f = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  f.addColorStop(0, 'rgba(0,0,0,1)'); f.addColorStop(0.55, 'rgba(0,0,0,.65)'); f.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = f; g.fillRect(-R, -R, S, S);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

// ────────────────────────────────────────────────────────────── shared material bits
const ACCENT = new THREE.Color('#ffb454');
const CAP = new THREE.Color('#e0913f');
const capUniforms = { uCap: { value: 0 }, uCapColor: { value: CAP } };
const clipPlanes = [];          // shared by every model material; filled when section is on
const sectionPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
let ghostColor = new THREE.Color(THEMES.dark.ghost);
let ghostOpacity = THEMES.dark.ghostOp;

function finishFor(label) {
  const n = label.toLowerCase();
  if (/golf/.test(n)) return { metalness: 0, roughness: 0.42, kind: 'Plastic' };
  if (/o-ring|buna|rubber|tire|tyre/.test(n)) return { metalness: 0, roughness: 0.8, kind: 'Rubber' };
  if (/brass|heat-set|insert/.test(n)) return { metalness: 1, roughness: 0.3, kind: 'Brass' };
  if (/black-oxide/.test(n)) return { metalness: 0.85, roughness: 0.42, kind: 'Black-oxide steel' };
  if (/winding|coil/.test(n)) return { metalness: 0.85, roughness: 0.3, kind: 'Copper' };
  if (/alumin/.test(n)) return { metalness: 0.9, roughness: 0.34, kind: 'Aluminium' };
  if (/screw|nut\b|washer|bolt|dowel|\bpin\b|standoff|spring|\brod\b|bearing|steel|stainless|magnet|iron core|slug|\bball\b|race|shaft|plunger|plundger/.test(n)) return { metalness: 0.9, roughness: 0.3, kind: 'Metal' };
  if (/pcb|pi3hat|power dist|raspberry|rpi|connector|port|sdram|controller|transceiver|pmic|module|capacitor|header/.test(n)) return { metalness: 0.15, roughness: 0.55, kind: 'Electronics' };
  if (/battery/.test(n)) return { metalness: 0.1, roughness: 0.45, kind: 'Battery pack' };
  return { metalness: 0.0, roughness: 0.52, kind: 'Plastic' };
}
function makeMaterial(rgb, fin) {
  const color = new THREE.Color().setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace);
  const m = new THREE.MeshStandardMaterial({
    color, metalness: fin.metalness, roughness: fin.roughness, side: THREE.DoubleSide,
    clippingPlanes: clipPlanes, clipShadows: true, envMapIntensity: fin.metalness > 0.5 ? 1.15 : 1,
  });
  m.userData.base = color.clone();
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uCap = capUniforms.uCap; sh.uniforms.uCapColor = capUniforms.uCapColor;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uCap;\nuniform vec3 uCapColor;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n\tif (uCap > 0.5 && !gl_FrontFacing) gl_FragColor = vec4(uCapColor, gl_FragColor.a);');
  };
  m.customProgramCacheKey = () => 'kv-cap';
  return m;
}
const edgeMatFront = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.95, clippingPlanes: clipPlanes });
const edgeMatBack = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.2, depthTest: false, depthWrite: false, clippingPlanes: clipPlanes });

// ────────────────────────────────────────────────────────────── model state
let meta, geoms = [], asms = [], groups = [], parts = [], allMeshes = [], pickables = [];
const modelBox = new THREE.Box3();       // CAD space, collapsed
const worldBox = new THREE.Box3();       // world space, collapsed
const modelCenter = new THREE.Vector3();
let modelRadius = 100, groundY = 0;
let ground, grid;

let dirty = true, shadowDirty = true, lastInteraction = 0;
let explode = 0;
let xray = false, sectionOn = false, sectionAxis = 'y', sectionFlip = false, sectionT = 0.5;
let selection = null;          // { kind: 'part'|'group'|'asm', ref }
let selParts = new Set(), hoverParts = new Set();
let isolated = null;
const tour = { active: false, i: 0, playing: true, t0: 0, focus: null };

// ────────────────────────────────────────────────────────────── loading
function setProgress(p, msg) {
  $('#loader-ring').style.strokeDashoffset = String(169.6 * (1 - p));
  if (msg) $('#loader-status').textContent = msg;
}
function b64ToBytes(s) {
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(s);
  const bin = atob(s); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
async function loadModel() {
  setProgress(0.05, 'Unpacking model…');
  await sleep();
  const el = document.getElementById('model-data');
  const gz = b64ToBytes(el.textContent.trim());
  el.textContent = '';
  const buf = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const jl = new DataView(buf).getUint32(0, true);
  meta = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, jl)));
  const body = new Uint8Array(buf, 8 + jl);
  await MeshoptDecoder.ready;
  setProgress(0.2, 'Decoding geometry…');
  await sleep();

  let t = performance.now();
  for (let gi = 0; gi < meta.geoms.length; gi++) {
    const g = meta.geoms[gi];
    const q = new Uint16Array(g.v * 4);
    MeshoptDecoder.decodeVertexBuffer(new Uint8Array(q.buffer), g.v, 8, body.subarray(g.P[0], g.P[0] + g.P[1]));
    const pos = new Float32Array(g.v * 3);
    const sx = (g.max[0] - g.min[0]) / 65535, sy = (g.max[1] - g.min[1]) / 65535, sz = (g.max[2] - g.min[2]) / 65535;
    for (let i = 0; i < g.v; i++) {
      pos[i * 3] = g.min[0] + q[i * 4] * sx; pos[i * 3 + 1] = g.min[1] + q[i * 4 + 1] * sy; pos[i * 3 + 2] = g.min[2] + q[i * 4 + 2] * sz;
    }
    const n8 = new Int8Array(g.v * 4);
    MeshoptDecoder.decodeVertexBuffer(new Uint8Array(n8.buffer), g.v, 4, body.subarray(g.N[0], g.N[0] + g.N[1]), 'OCTAHEDRAL');
    const nrm = new Float32Array(g.v * 3);
    for (let i = 0; i < g.v; i++) {
      const x = n8[i * 4], y = n8[i * 4 + 1], z = n8[i * 4 + 2]; const l = Math.hypot(x, y, z) || 1;
      nrm[i * 3] = x / l; nrm[i * 3 + 1] = y / l; nrm[i * 3 + 2] = z / l;
    }
    const idx = g.isz === 2 ? new Uint16Array(g.i) : new Uint32Array(g.i);
    MeshoptDecoder.decodeIndexBuffer(new Uint8Array(idx.buffer), g.i, g.isz, body.subarray(g.I[0], g.I[0] + g.I[1]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.boundingBox = new THREE.Box3(new THREE.Vector3(...g.min), new THREE.Vector3(...g.max));
    geo.computeBoundingSphere();
    geo.computeBoundsTree();
    geo.userData.tris = g.i / 3;
    geoms.push(geo);
    if (performance.now() - t > 40) { setProgress(0.2 + 0.6 * (gi / meta.geoms.length), 'Decoding geometry…'); await sleep(); t = performance.now(); }
  }
  setProgress(0.85, 'Assembling…');
  await sleep();
  buildScene();
  setProgress(1, 'Ready');
}

// ────────────────────────────────────────────────────────────── scene construction
const _m = new THREE.Matrix4(), _v = new THREE.Vector3(), _b = new THREE.Box3(), _c = new THREE.Vector3();
function buildScene() {
  asms = meta.assemblies.map((a, i) => ({ id: i, name: a.name, base: a.base, parts: [], groups: [], box: new THREE.Box3(), center: new THREE.Vector3(), visible: true }));
  groups = (meta.groups || []).map((g, i) => ({ id: i, name: g.name, asm: asms[g.asm], parts: [], box: new THREE.Box3() }));
  groups.forEach((g) => g.asm.groups.push(g));

  parts = meta.parts.map((p, i) => {
    const part = {
      id: i, name: p.name, pn: p.pn, count: p.count, asm: asms[p.asm], group: p.group >= 0 ? groups[p.group] : null,
      meshes: [], materials: [], box: new THREE.Box3(), visible: true, tris: 0, fin: finishFor(`${p.name} ${p.hint || ''}`),
      color: p.batches[0].color, unit: null,
    };
    part.asm.parts.push(part);
    if (part.group) part.group.parts.push(part);
    let big = 0;
    for (const b of p.batches) {
      const geo = geoms[b.g];
      const n = b.m.length / 12;
      const mat = makeMaterial(b.color, part.fin);
      const im = new THREE.InstancedMesh(geo, mat, n);
      const a = im.instanceMatrix.array;
      for (let k = 0; k < n; k++) {
        const s = b.m, o = k * 12, d = k * 16;
        a[d] = s[o]; a[d + 1] = s[o + 1]; a[d + 2] = s[o + 2]; a[d + 3] = 0;
        a[d + 4] = s[o + 3]; a[d + 5] = s[o + 4]; a[d + 6] = s[o + 5]; a[d + 7] = 0;
        a[d + 8] = s[o + 6]; a[d + 9] = s[o + 7]; a[d + 10] = s[o + 8]; a[d + 11] = 0;
        a[d + 12] = s[o + 9]; a[d + 13] = s[o + 10]; a[d + 14] = s[o + 11]; a[d + 15] = 1;
      }
      im.userData = { part, gi: b.g, base: new Float32Array(a), off: new Float32Array(n * 3), centers: new Float32Array(n * 3) };
      im.castShadow = true;
      im.receiveShadow = false;
      // per-instance CAD-space bounds
      for (let k = 0; k < n; k++) {
        _m.fromArray(a, k * 16);
        _b.copy(geo.boundingBox).applyMatrix4(_m);
        part.box.union(_b);
        _b.getCenter(_c); _c.toArray(im.userData.centers, k * 3);
      }
      const bt = geo.userData.tris * n;
      part.tris += bt;
      if (bt > big) { big = bt; part.color = b.color; part.unit = geo.boundingBox.getSize(new THREE.Vector3()); }
      part.meshes.push(im); part.materials.push(mat); allMeshes.push(im);
      cadRoot.add(im);
    }
    part.asm.box.union(part.box);
    if (part.group) part.group.box.union(part.box);
    return part;
  });
  asms.forEach((a) => { a.box.getCenter(a.center); modelBox.union(a.box); });
  modelBox.getCenter(modelCenter);

  // explode offsets (CAD space: Z up)
  const size = modelBox.getSize(new THREE.Vector3());
  const zBase = modelBox.min.z;
  const shellAsm = asms.find((a) => a.base === 'Shell');
  const refH = shellAsm ? shellAsm.box.max.z - zBase : size.z;
  for (const im of allMeshes) {
    const { part, centers, off } = im.userData;
    const A = part.asm;
    const grp = part.group;
    const n = off.length / 3;
    let ax = (A.center.x - modelCenter.x) * 0.95, ay = (A.center.y - modelCenter.y) * 0.95;
    let az = (A.center.z - zBase) * 0.9;
    // presentation tweaks: the enclosure lifts clear of everything, wheels slide straight out
    if (A.base === 'Shell') { ax = ay = 0; az = refH * 1.55; }
    else if (A.base === 'Lid') { ax = ay = 0; az = refH * 2.0; }
    else if (A.base === 'Omni Wheel') { ax *= 1.15; ay *= 1.15; az = 0; }
    else if (A.base === 'Base Plate') { az = 0; }
    const gc = grp ? grp.box.getCenter(new THREE.Vector3()) : null;
    for (let k = 0; k < n; k++) {
      const cx = centers[k * 3], cy = centers[k * 3 + 1], cz = centers[k * 3 + 2];
      let px = (cx - A.center.x) * 0.42, py = (cy - A.center.y) * 0.42, pz = (cz - A.center.z) * 0.42;
      if (gc) { px += (cx - gc.x) * 0.25; py += (cy - gc.y) * 0.25; pz += (cz - gc.z) * 0.25; }
      off[k * 3] = ax + px; off[k * 3 + 1] = ay + py; off[k * 3 + 2] = az + pz;
    }
  }
  void size;

  scene.updateMatrixWorld(true);
  worldBox.copy(modelBox).applyMatrix4(cadRoot.matrixWorld);
  const sphere = worldBox.getBoundingSphere(new THREE.Sphere());
  modelRadius = sphere.radius;
  groundY = worldBox.min.y - 0.2;

  // ground: shadow catcher + polar grid
  ground = new THREE.Mesh(new THREE.PlaneGeometry(modelRadius * 12, modelRadius * 12), new THREE.ShadowMaterial({ opacity: THEMES.dark.shadow, transparent: true, depthWrite: false }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(sphere.center.x, groundY, sphere.center.z);
  ground.receiveShadow = true; ground.renderOrder = -2;
  scene.add(ground);
  grid = new THREE.Mesh(new THREE.PlaneGeometry(modelRadius * 5.2, modelRadius * 5.2), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: makeGridTexture(THEMES.dark) }));
  grid.rotation.x = -Math.PI / 2; grid.position.set(sphere.center.x, groundY - 0.05, sphere.center.z);
  grid.renderOrder = -3;
  scene.add(grid);

  // lights sized to model
  const c = sphere.center;
  key.position.set(c.x - modelRadius * 1.2, c.y + modelRadius * 3.2, c.z + modelRadius * 1.6);
  key.target.position.copy(c);
  const sc = key.shadow.camera; const R = modelRadius * 2.6;
  sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.near = modelRadius * 0.5; sc.far = modelRadius * 8;
  sc.updateProjectionMatrix();
  rim.position.set(c.x + modelRadius * 2, c.y + modelRadius, c.z - modelRadius * 2.5); rim.target.position.copy(c);

  camera.near = modelRadius / 80; camera.far = modelRadius * 60; camera.updateProjectionMatrix();
  controls.target.copy(c);
  controls.minDistance = modelRadius * 0.05;
  controls.maxDistance = modelRadius * 12;

  // AO tuned to model scale (mm)
  gtao.updateGtaoMaterial({ radius: modelRadius * 0.07, distanceExponent: 1.6, thickness: modelRadius * 0.02, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, rings: 2, samples: 12 });

  updatePickables();
  applyTheme('dark', true);
}

function updatePickables() {
  pickables = allMeshes.filter((m) => m.visible);
  shadowDirty = true; dirty = true;
}

// ────────────────────────────────────────────────────────────── explode
function setExplode(v, fromSlider = false) {
  explode = Math.max(0, Math.min(1, v));
  const e = explode * 1.0;
  for (const im of allMeshes) {
    const { base, off } = im.userData;
    const a = im.instanceMatrix.array;
    const n = off.length / 3;
    for (let k = 0; k < n; k++) {
      a[k * 16 + 12] = base[k * 16 + 12] + off[k * 3] * e;
      a[k * 16 + 13] = base[k * 16 + 13] + off[k * 3 + 1] * e;
      a[k * 16 + 14] = base[k * 16 + 14] + off[k * 3 + 2] * e;
    }
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.boundingBox = null;
  }
  const s = $('#explode');
  if (!fromSlider) s.value = String(Math.round(explode * 1000));
  s.style.setProperty('--p', `${explode * 100}%`);
  $('#btn-explode').classList.toggle('on', explode > 0.001);
  if (selParts.size) rebuildEdges();
  if (sectionOn) updateSection();
  shadowDirty = true; dirty = true;
}

// ────────────────────────────────────────────────────────────── bounds helpers
function boxOfParts(list) {
  const box = new THREE.Box3();
  for (const p of list) for (const im of p.meshes) {
    if (!im.visible && list.length > 1) continue;
    if (!im.boundingBox) im.computeBoundingBox();
    box.union(_b.copy(im.boundingBox).applyMatrix4(im.matrixWorld));
  }
  return box;
}
function partsOf(sel) {
  if (!sel) return [];
  if (sel.kind === 'part') return [sel.ref];
  return sel.ref.parts;
}

// ────────────────────────────────────────────────────────────── materials / emphasis
function refreshMaterials() {
  const emph = tour.active && tour.focus ? tour.focus : xray ? selParts : null;
  const ghosting = !!emph;
  for (const p of parts) {
    const ghost = ghosting && !emph.has(p);
    const hl = selParts.has(p) ? 2 : hoverParts.has(p) ? 1 : 0;
    for (const m of p.materials) {
      if (m.transparent !== ghost) {
        m.transparent = ghost; m.depthWrite = !ghost; m.side = ghost ? THREE.FrontSide : THREE.DoubleSide; m.needsUpdate = true;
      }
      m.opacity = ghost ? ghostOpacity : 1;
      m.color.copy(m.userData.base);
      if (ghost) m.color.lerp(ghostColor, 0.55);
      m.emissive.copy(ACCENT);
      m.emissiveIntensity = ghost ? 0 : hl === 2 ? 0.42 : hl === 1 ? 0.2 : 0;
      if (hl === 2 && !ghost) m.color.lerp(ACCENT, 0.18);
    }
    for (const im of p.meshes) im.castShadow = !ghost;
  }
  gtao.enabled = !ghosting && !sectionOn;
  shadowDirty = true; dirty = true;
}

// selection edge overlay
let edgeObjs = [];
const edgeCache = new Map();
function rebuildEdges() {
  for (const o of edgeObjs) { o.parent.remove(o); o.geometry.dispose(); }
  edgeObjs = [];
  if (!selParts.size) return;
  const chunks = []; let total = 0;
  for (const p of selParts) {
    for (const im of p.meshes) {
      if (!im.visible) continue;
      const gi = im.userData.gi;
      if (!edgeCache.has(gi)) edgeCache.set(gi, new THREE.EdgesGeometry(geoms[gi], 28).attributes.position.array);
      const src = edgeCache.get(gi);
      const n = im.count; const out = new Float32Array(src.length * n);
      const a = im.instanceMatrix.array;
      for (let k = 0; k < n; k++) {
        const e = k * 16, o = k * src.length;
        for (let j = 0; j < src.length; j += 3) {
          const x = src[j], y = src[j + 1], z = src[j + 2];
          out[o + j] = a[e] * x + a[e + 4] * y + a[e + 8] * z + a[e + 12];
          out[o + j + 1] = a[e + 1] * x + a[e + 5] * y + a[e + 9] * z + a[e + 13];
          out[o + j + 2] = a[e + 2] * x + a[e + 6] * y + a[e + 10] * z + a[e + 14];
        }
      }
      chunks.push(out); total += out.length;
    }
  }
  if (!total) return;
  const all = new Float32Array(total); let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(all, 3));
  const back = new THREE.LineSegments(geo, edgeMatBack); back.renderOrder = 10;
  const front = new THREE.LineSegments(geo, edgeMatFront); front.renderOrder = 11;
  back.raycast = front.raycast = () => {};
  cadRoot.add(back, front);
  edgeObjs = [back, front];
  dirty = true;
}

// ────────────────────────────────────────────────────────────── selection
function select(sel, { focus = false, fromTree = false } = {}) {
  selection = sel;
  selParts = new Set(partsOf(sel));
  refreshMaterials();
  rebuildEdges();
  updateInspector();
  syncTreeSelection(!fromTree);
  if (focus && sel) frameParts([...selParts]);
}
function setHover(list) {
  const next = new Set(list || []);
  if (next.size === hoverParts.size && [...next].every((p) => hoverParts.has(p))) return;
  hoverParts = next;
  refreshMaterials();
  $$('#tree .row.hl').forEach((r) => r.classList.remove('hl'));
}

// ────────────────────────────────────────────────────────────── visibility
function setPartVisible(p, v) {
  p.visible = v;
  for (const im of p.meshes) im.visible = v;
}
function showAll() {
  parts.forEach((p) => setPartVisible(p, true));
  isolated = null;
  afterVisibility();
}
function isolate(sel) {
  const keep = new Set(partsOf(sel));
  if (!keep.size) return;
  parts.forEach((p) => setPartVisible(p, keep.has(p)));
  isolated = sel;
  afterVisibility();
  frameParts([...keep]);
}
function hideSel(sel) {
  partsOf(sel).forEach((p) => setPartVisible(p, false));
  select(null);
  afterVisibility();
}
function afterVisibility() {
  updatePickables();
  syncTreeVisibility();
  if (selParts.size) rebuildEdges();
  const chip = $('#isolate-chip');
  const anyHidden = parts.some((p) => !p.visible);
  chip.hidden = !anyHidden;
  if (anyHidden) {
    const hidden = parts.filter((p) => !p.visible).reduce((s, p) => s + p.count, 0);
    $('#isolate-label').textContent = isolated ? `Isolated: ${nameOf(isolated)}` : `${fmt(hidden)} bodies hidden`;
  }
}
const nameOf = (sel) => sel.ref.name;

// ────────────────────────────────────────────────────────────── camera motion
const tweens = [];
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function tween(dur, fn, done) {
  const tw = { t0: performance.now(), dur, fn, done };
  tweens.push(tw);
  return tw;
}
let camTween = null;
function flyTo(pos, target, dur = 1100) {
  if (camTween) { tweens.splice(tweens.indexOf(camTween), 1); camTween = null; }
  const p0 = camera.position.clone(), t0 = controls.target.clone();
  // arc through a slightly zoomed-out midpoint for a smoother cinematic move
  const d0 = p0.distanceTo(t0), d1 = pos.distanceTo(target);
  const dir0 = p0.clone().sub(t0).normalize(), dir1 = pos.clone().sub(target).normalize();
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion().setFromUnitVectors(dir0, dir1);
  camTween = tween(dur, (k) => {
    const e = ease(k);
    const tgt = t0.clone().lerp(target, e);
    const dir = dir0.clone().applyQuaternion(q0.clone().slerp(q1, e));
    const bump = Math.sin(Math.PI * e) * 0.12 * Math.max(d0, d1);
    const dist = THREE.MathUtils.lerp(d0, d1, e) + bump;
    camera.position.copy(tgt).addScaledVector(dir, dist);
    controls.target.copy(tgt);
  }, () => { camTween = null; });
}
function fitDistance(radius) {
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * Math.max(0.3, (w - 2 * viewShiftTarget) / h));
  return radius / Math.sin(Math.min(vfov, hfov) / 2);
}
function frameBox(box, dir, pad = 1.08, dur) {
  if (box.isEmpty()) return;
  const s = box.getBoundingSphere(new THREE.Sphere());
  const d = dir ? dir.clone().normalize() : camera.position.clone().sub(controls.target).normalize();
  const dist = Math.max(fitDistance(s.radius) * pad, modelRadius * 0.12);
  flyTo(s.center.clone().addScaledVector(d, dist), s.center, dur);
}
function frameParts(list, dir, pad = 1.25, dur) { frameBox(boxOfParts(list), dir, pad, dur); }
function frameAll(dir, dur) {
  const box = boxOfParts(parts.filter((p) => p.visible));
  frameBox(box.isEmpty() ? worldBox : box, dir, 1.02, dur);
}
const VIEWS = {
  iso: new THREE.Vector3(1, 0.72, 1.35),
  front: new THREE.Vector3(0, 0.1, 1),
  side: new THREE.Vector3(1, 0.1, 0),
  top: new THREE.Vector3(0, 1, 0.0015),
};

// ────────────────────────────────────────────────────────────── section
let sectionViz;
function updateSection() {
  const ax = { x: 0, y: 1, z: 2 }[sectionAxis];
  const box = boxOfParts(parts.filter((p) => p.visible));
  const lo = box.min.getComponent(ax) - 0.5, hi = box.max.getComponent(ax) + 0.5;
  const pos = lo + (hi - lo) * sectionT;
  const n = new THREE.Vector3(); n.setComponent(ax, sectionFlip ? 1 : -1);
  sectionPlane.normal.copy(n);
  sectionPlane.constant = sectionFlip ? -pos : pos;
  if (!sectionViz) {
    const g = new THREE.PlaneGeometry(1, 1);
    sectionViz = new THREE.Group();
    const fill = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.7 }));
    fill.raycast = edge.raycast = () => {};
    sectionViz.add(fill, edge);
    scene.add(sectionViz);
  }
  const size = box.getSize(new THREE.Vector3()).multiplyScalar(1.15);
  const ctr = box.getCenter(new THREE.Vector3()); ctr.setComponent(ax, pos);
  sectionViz.position.copy(ctr);
  sectionViz.rotation.set(0, 0, 0);
  if (sectionAxis === 'x') { sectionViz.rotation.y = Math.PI / 2; sectionViz.scale.set(size.z, size.y, 1); }
  else if (sectionAxis === 'y') { sectionViz.rotation.x = -Math.PI / 2; sectionViz.scale.set(size.x, size.z, 1); }
  else sectionViz.scale.set(size.x, size.y, 1);
  sectionViz.visible = sectionOn && !$('#section-pop').hidden;
  shadowDirty = true; dirty = true;
}
function setSection(on) {
  sectionOn = on;
  clipPlanes.length = 0;
  if (on) clipPlanes.push(sectionPlane);
  capUniforms.uCap.value = on ? 1 : 0;
  $('#btn-section').classList.toggle('on', on);
  $('#section-pop').hidden = !on;
  if (on) { placePop(); updateSection(); }
  else if (sectionViz) sectionViz.visible = false;
  // materials need recompiling for a changed clipping-plane count
  for (const p of parts) for (const m of p.materials) m.needsUpdate = true;
  refreshMaterials();
}
function placePop() {
  const r = $('#btn-section').getBoundingClientRect();
  const pop = $('#section-pop');
  const w = 250;
  pop.style.left = `${Math.max(12, Math.min(window.innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
  pop.style.bottom = `${window.innerHeight - r.top + 14}px`;
}

// ────────────────────────────────────────────────────────────── picking
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
let pointer = { x: 0, y: 0, inside: false, moved: false, down: null, dragging: false };
function pick(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  raycaster.firstHitOnly = !sectionOn;
  const hits = raycaster.intersectObjects(pickables, false);
  let ghostHit = null;
  const emph = tour.active && tour.focus ? tour.focus : xray ? selParts : null;
  for (const h of hits) {
    if (sectionOn && sectionPlane.distanceToPoint(h.point) < 0) continue;
    const part = h.object.userData.part;
    if (emph && emph.size && !emph.has(part)) { ghostHit = ghostHit || h; continue; }
    return h;
  }
  return ghostHit;
}

// ────────────────────────────────────────────────────────────── UI: tree
const treeEl = $('#tree');
function swatch(rgb, fin) {
  const c = `rgb(${rgb.map((v) => Math.round(v * 255)).join(',')})`;
  return `<span class="sw${fin && fin.metalness > 0.5 ? ' metal' : ''}" style="background-color:${c}"></span>`;
}
function asmColor(a) {
  let best = null, t = -1;
  for (const p of a.parts) if (p.tris > t && p.fin.metalness < 0.5) { t = p.tris; best = p; }
  return (best || a.parts[0]).color;
}
function buildTree() {
  const html = [];
  const partRow = (p, lvl) => `<div class="node lvl-${lvl}" data-kind="part" data-id="${p.id}"><div class="row" role="treeitem"><span class="spacer"></span>${swatch(p.color, p.fin)}<span class="lbl" title="${esc(p.name)}">${esc(p.name)}</span><span class="qty">${p.count > 1 ? '×' + p.count : ''}</span><button class="eye" title="Show / hide">${icon('eye')}</button></div></div>`;
  for (const a of asms) {
    const bodies = a.parts.reduce((s, p) => s + p.count, 0);
    html.push(`<div class="node lvl-0" data-kind="asm" data-id="${a.id}"><div class="row" role="treeitem"><button class="chev">${icon('chev')}</button>${swatch(asmColor(a))}<span class="lbl">${esc(a.name)}</span><span class="qty">${fmt(bodies)}</span><button class="eye" title="Show / hide">${icon('eye')}</button></div><div class="children">`);
    for (const g of a.groups) {
      const gb = g.parts.reduce((s, p) => s + p.count, 0);
      html.push(`<div class="node lvl-1" data-kind="group" data-id="${g.id}"><div class="row" role="treeitem"><button class="chev">${icon('chev')}</button>${swatch(asmColor(g))}<span class="lbl" title="${esc(g.name)}">${esc(g.name)}</span><span class="qty">${fmt(gb)}</span><button class="eye" title="Show / hide">${icon('eye')}</button></div><div class="children">`);
      [...g.parts].sort(byName).forEach((p) => html.push(partRow(p, 2)));
      html.push('</div></div>');
    }
    [...a.parts].filter((p) => !p.group).sort(byName).forEach((p) => html.push(partRow(p, 1)));
    html.push('</div></div>');
  }
  treeEl.innerHTML = html.join('');
  $('#tree-count').textContent = `${parts.length} parts`;
}
const byName = (a, b) => (b.tris > 20000) - (a.tris > 20000) || a.name.localeCompare(b.name, undefined, { numeric: true });
function refOf(node) {
  const id = +node.dataset.id;
  return node.dataset.kind === 'asm' ? { kind: 'asm', ref: asms[id] } : node.dataset.kind === 'group' ? { kind: 'group', ref: groups[id] } : { kind: 'part', ref: parts[id] };
}
function nodeFor(sel) { return sel && treeEl.querySelector(`.node[data-kind="${sel.kind}"][data-id="${sel.ref.id}"]`); }
treeEl.addEventListener('click', (e) => {
  const node = e.target.closest('.node'); if (!node) return;
  const sel = refOf(node);
  if (e.target.closest('.chev')) { node.classList.toggle('open'); return; }
  if (e.target.closest('.eye')) {
    const list = partsOf(sel); const v = !list.every((p) => p.visible);
    list.forEach((p) => setPartVisible(p, v));
    if (v === false && list.some((p) => selParts.has(p))) select(null);
    isolated = null;
    afterVisibility();
    return;
  }
  const same = selection && selection.kind === sel.kind && selection.ref === sel.ref;
  if (same) { frameParts(partsOf(sel)); return; }
  select(sel, { fromTree: true });
  if (sel.kind !== 'part' && !node.classList.contains('open')) node.classList.add('open');
});
treeEl.addEventListener('dblclick', (e) => {
  const node = e.target.closest('.node'); if (!node || e.target.closest('.eye,.chev')) return;
  frameParts(partsOf(refOf(node)));
});
treeEl.addEventListener('pointerover', (e) => {
  const node = e.target.closest('.node'); if (!node) return;
  setHover(partsOf(refOf(node)).filter((p) => p.visible));
});
treeEl.addEventListener('pointerleave', () => setHover(null));
function syncTreeSelection(reveal) {
  $$('#tree .row.sel').forEach((r) => r.classList.remove('sel'));
  const node = nodeFor(selection);
  if (!node) return;
  node.querySelector(':scope > .row').classList.add('sel');
  if (reveal) {
    let p = node.parentElement.closest('.node');
    while (p) { p.classList.add('open'); p = p.parentElement.closest('.node'); }
    node.querySelector(':scope > .row').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}
function syncTreeVisibility() {
  treeEl.querySelectorAll('.node').forEach((node) => {
    const list = partsOf(refOf(node));
    const on = list.some((p) => p.visible);
    const row = node.querySelector(':scope > .row');
    row.classList.toggle('off', !on);
    const eye = row.querySelector('.eye');
    const want = on ? 'eye' : 'eyeoff';
    if (eye.dataset.state !== want) { eye.innerHTML = icon(want); eye.dataset.state = want; }
  });
}
function filterTree(q) {
  q = q.trim().toLowerCase();
  const nodes = treeEl.querySelectorAll('.node');
  let shown = 0;
  nodes.forEach((n) => {
    const lbl = n.querySelector(':scope > .row .lbl');
    const text = lbl.getAttribute('data-raw') || lbl.textContent;
    lbl.setAttribute('data-raw', text);
    lbl.innerHTML = esc(text);
  });
  if (!q) {
    nodes.forEach((n) => { n.hidden = false; });
    treeEl.querySelector('.tree-empty')?.remove();
    return;
  }
  const match = (n) => {
    const sel = refOf(n); const raw = n.querySelector(':scope > .row .lbl').getAttribute('data-raw');
    const hay = `${raw} ${sel.kind === 'part' ? sel.ref.pn || '' : ''}`.toLowerCase();
    return hay.includes(q);
  };
  const walk = (n) => {
    const kids = [...n.querySelectorAll(':scope > .children > .node')];
    const self = match(n);
    let any = false;
    for (const k of kids) any = walk(k, self) || any;
    const vis = self || any;
    n.hidden = !vis;
    if (vis && any) n.classList.add('open');
    if (self) {
      const lbl = n.querySelector(':scope > .row .lbl'); const raw = lbl.getAttribute('data-raw');
      const i = raw.toLowerCase().indexOf(q);
      if (i >= 0) lbl.innerHTML = esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + q.length)) + '</mark>' + esc(raw.slice(i + q.length));
      if (kids.length && !any) kids.forEach((k) => { k.hidden = false; k.querySelectorAll('.node').forEach((d) => { d.hidden = false; }); });
      shown++;
    }
    return vis;
  };
  treeEl.querySelectorAll(':scope > .node').forEach((n) => walk(n));
  treeEl.querySelector('.tree-empty')?.remove();
  if (!shown) treeEl.insertAdjacentHTML('beforeend', `<div class="tree-empty">No parts match “${esc(q)}”</div>`);
}

// ────────────────────────────────────────────────────────────── UI: inspector
function updateInspector() {
  const el = $('#inspector');
  if (!selection || tour.active) { el.hidden = true; return; }
  const { kind, ref } = selection;
  el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  $('#insp-kind').textContent = kind === 'asm' ? 'Assembly' : kind === 'group' ? 'Sub-assembly' : 'Part';
  $('#insp-name').textContent = ref.name;
  const parent = $('#insp-parent');
  const up = kind === 'part' ? (ref.group ? { kind: 'group', ref: ref.group } : { kind: 'asm', ref: ref.asm }) : kind === 'group' ? { kind: 'asm', ref: ref.asm } : null;
  parent.hidden = !up;
  if (up) { parent.innerHTML = `${icon('left')}${esc(up.ref.name)}`; parent.onclick = () => select(up, { focus: false }); }
  const pn = $('#insp-pn');
  pn.hidden = !(kind === 'part' && ref.pn);
  if (kind === 'part' && ref.pn) pn.textContent = `McMaster-Carr ${ref.pn}`;
  const list = partsOf(selection);
  const bodies = list.reduce((s, p) => s + p.count, 0);
  const tris = list.reduce((s, p) => s + p.tris, 0);
  const env = (kind === 'part' ? ref.box : ref.box).getSize(new THREE.Vector3());
  const rows = [];
  if (kind === 'part') {
    rows.push(['Quantity', fmt(ref.count)]);
    if (ref.unit) rows.push([ref.count > 1 ? 'Unit envelope' : 'Envelope', `${fmtMM(ref.unit.x)} × ${fmtMM(ref.unit.y)} × ${fmtMM(ref.unit.z)} mm`]);
    rows.push(['Finish', `${swatch(ref.color, ref.fin)}${esc(ref.fin.kind)}`]);
  } else {
    rows.push(['Unique parts', fmt(list.length)]);
    rows.push(['Bodies', fmt(bodies)]);
    rows.push(['Envelope', `${fmtMM(env.x)} × ${fmtMM(env.y)} × ${fmtMM(env.z)} mm`]);
  }
  rows.push(['Triangles', fmt(tris)]);
  $('#insp-props').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
}

// ────────────────────────────────────────────────────────────── UI: toast
let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1600);
}

// ────────────────────────────────────────────────────────────── tour
let explodeTween = null;
function animateExplode(to, dur = 1100) {
  if (explodeTween) tweens.splice(tweens.indexOf(explodeTween), 1);
  const from = explode;
  if (Math.abs(from - to) < 1e-3) { explodeTween = null; return; }
  explodeTween = tween(dur, (k) => setExplode(from + (to - from) * ease(k)), () => { explodeTween = null; });
}
function tourSteps() {
  return TOUR.map((s) => ({ ...s, parts: s.asms ? parts.filter((p) => s.asms.some((n) => p.asm.base === n || p.asm.name === n)) : null }))
    .filter((s) => !s.asms || s.parts.length);
}
let steps = [];
function startTour() {
  steps = tourSteps();
  tour.active = true; tour.i = -1; tour.playing = true;
  if (sectionOn) setSection(false);
  if (xray) toggleXray(false);
  if (parts.some((p) => !p.visible)) showAll();
  select(null);
  app.classList.add('touring'); updateViewShift();
  $('#btn-tour').classList.add('on');
  $('#tour-card').hidden = false;
  $('#tour-dots').innerHTML = steps.map(() => '<i></i>').join('');
  setIcon($('#tour-play'), 'pause');
  gotoStep(0);
}
function stopTour() {
  if (!tour.active) return;
  tour.active = false; tour.focus = null;
  app.classList.remove('touring'); updateViewShift();
  $('#btn-tour').classList.remove('on');
  $('#tour-card').hidden = true;
  refreshMaterials();
  animateExplode(0);
  frameAll(VIEWS.iso);
}
function gotoStep(i) {
  if (i < 0 || i >= steps.length) { if (i >= steps.length) stopTour(); return; }
  tour.i = i; tour.t0 = performance.now();
  const s = steps[i];
  const card = $('#tour-card');
  card.classList.remove('tour-fade'); void card.offsetWidth; card.classList.add('tour-fade');
  $('#tour-step').textContent = `${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`;
  $('#tour-title').textContent = s.title;
  $('#tour-text').textContent = typeof s.text === 'function' ? s.text(tourStats(s)) : s.text;
  $$('#tour-dots i').forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'cur' : ''; d.style.removeProperty('--t'); });
  $('#tour-prev').disabled = i === 0;
  tour.focus = s.parts ? new Set(s.parts) : null;
  refreshMaterials();
  const ex = s.explode ?? 0;
  animateExplode(ex, 1300);
  // frame after the explode finishes moving: compute target bounds at the final explode state
  const prev = explode;
  setExplode(ex);
  const box = s.parts ? boxOfParts(s.parts) : boxOfParts(parts);
  setExplode(prev);
  let dir = VIEWS.iso;
  if (s.view) dir = new THREE.Vector3(...s.view);
  else if (s.parts) {
    // look at the focus from outside the robot, slightly above
    const c = box.getCenter(new THREE.Vector3()), wc = worldBox.getCenter(new THREE.Vector3());
    dir = new THREE.Vector3(c.x - wc.x, 0, c.z - wc.z);
    if (dir.lengthSq() < modelRadius * modelRadius * 0.01) dir.set(1, 0, 1.35);
    dir.normalize(); dir.y = 0.7;
  }
  frameBox(box, dir, s.parts ? s.pad ?? 1.3 : 1.05, 1700);
}
function tourStats(s) {
  const list = s.parts || parts;
  const count = (re) => list.filter((p) => re.test(p.name)).reduce((n, p) => n + p.count, 0);
  return { bodies: list.reduce((n, p) => n + p.count, 0), unique: list.length, count, asms: asms.length, total: parts.reduce((n, p) => n + p.count, 0) };
}
const TOUR_STEP_MS = 7500;

// ────────────────────────────────────────────────────────────── actions
function toggleXray(v = !xray) {
  xray = v; $('#btn-xray').classList.toggle('on', xray);
  refreshMaterials();
  toast(xray ? 'X-ray on' : 'X-ray off');
}
function toggleRotate(v = !controls.autoRotate) {
  controls.autoRotate = v; $('#btn-rotate').classList.toggle('on', v);
}
function applyTheme(name, initial = false) {
  theme = name;
  const t = THEMES[name];
  app.dataset.theme = name;
  if (scene.background) scene.background.dispose();
  scene.background = makeBackdrop(t);
  if (grid) { grid.material.map.dispose(); grid.material.map = makeGridTexture(t); grid.material.needsUpdate = true; }
  if (ground) ground.material.opacity = t.shadow;
  ghostColor = new THREE.Color(t.ghost); ghostOpacity = t.ghostOp;
  hemi.intensity = t.hemi; scene.environmentIntensity = t.env;
  setIcon($('#btn-theme'), name === 'dark' ? 'sun' : 'moon');
  if (!initial) refreshMaterials();
  dirty = true;
}
function screenshot() {
  const was = gtao.enabled;
  gtao.enabled = !(tour.active && tour.focus) && !(xray) && !sectionOn;
  composer.render();
  canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rabbitbot-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, 'image/png');
  gtao.enabled = was;
  toast('Screenshot saved');
}

// ────────────────────────────────────────────────────────────── wiring
function wireUI() {
  hydrateIcons();
  $('#btn-tree').classList.add('on');
  $('#btn-tree').onclick = () => { const c = $('#tree-panel').classList.toggle('closed'); $('#btn-tree').classList.toggle('on', !c); updateViewShift(); };
  $('#tree-collapse').onclick = () => $$('#tree .node.open').forEach((n) => n.classList.remove('open'));
  const ex = $('#explode');
  ex.addEventListener('input', () => { if (explodeTween) { tweens.splice(tweens.indexOf(explodeTween), 1); explodeTween = null; } setExplode(ex.value / 1000, true); });
  $('#btn-explode').onclick = () => animateExplode(explode > 0.5 ? 0 : 1);
  $('#btn-section').onclick = () => setSection(!sectionOn);
  $$('#section-axis button').forEach((b) => (b.onclick = () => {
    sectionAxis = b.dataset.axis; $$('#section-axis button').forEach((x) => x.classList.toggle('on', x === b)); updateSection();
  }));
  $('#section-flip').onclick = () => { sectionFlip = !sectionFlip; updateSection(); };
  const sr = $('#section-range');
  const srSync = () => sr.style.setProperty('--p', `${sr.value / 10}%`);
  srSync();
  sr.addEventListener('input', () => { sectionT = sr.value / 1000; srSync(); updateSection(); });
  $('#btn-xray').onclick = () => toggleXray();
  $('#btn-rotate').onclick = () => toggleRotate();
  $$('[data-view]').forEach((b) => (b.onclick = () => frameAll(VIEWS[b.dataset.view])));
  $('#btn-tour').onclick = () => (tour.active ? stopTour() : startTour());
  $('#tour-exit').onclick = stopTour;
  $('#tour-next').onclick = () => { tour.playing = false; setIcon($('#tour-play'), 'play'); gotoStep(tour.i + 1); };
  $('#tour-prev').onclick = () => { tour.playing = false; setIcon($('#tour-play'), 'play'); gotoStep(tour.i - 1); };
  $('#tour-play').onclick = () => { tour.playing = !tour.playing; tour.t0 = performance.now(); setIcon($('#tour-play'), tour.playing ? 'pause' : 'play'); };
  $('#btn-theme').onclick = () => applyTheme(theme === 'dark' ? 'light' : 'dark');
  $('#btn-shot').onclick = screenshot;
  $('#btn-full').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  $('#btn-help').onclick = () => { $('#help').hidden = !$('#help').hidden; };
  $('#help-close').onclick = () => { $('#help').hidden = true; };
  $('#help').onclick = (e) => { if (e.target.id === 'help') $('#help').hidden = true; };
  $('#insp-close').onclick = () => select(null);
  $('#act-focus').onclick = () => selection && frameParts(partsOf(selection));
  $('#act-isolate').onclick = () => selection && isolate(selection);
  $('#act-hide').onclick = () => selection && hideSel(selection);
  $('#isolate-exit').onclick = () => { showAll(); frameAll(); };
  const search = $('#search');
  search.addEventListener('input', () => filterTree(search.value));
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape') { search.value = ''; filterTree(''); search.blur(); } e.stopPropagation(); });

  // canvas pointer
  canvas.addEventListener('pointerdown', (e) => {
    pointer.down = { x: e.clientX, y: e.clientY, t: performance.now(), b: e.button };
    pointer.dragging = false;
    if (tour.active && tour.playing) { tour.playing = false; setIcon($('#tour-play'), 'play'); }
    if (camTween) { tweens.splice(tweens.indexOf(camTween), 1); camTween = null; }
    lastInteraction = performance.now();
  });
  canvas.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY; pointer.inside = true; pointer.moved = true;
    if (pointer.down && Math.hypot(e.clientX - pointer.down.x, e.clientY - pointer.down.y) > 4) pointer.dragging = true;
  });
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; setHover(null); $('#tooltip').hidden = true; canvas.classList.remove('hovering'); });
  canvas.addEventListener('pointerup', (e) => {
    const d = pointer.down; pointer.down = null;
    if (!d || pointer.dragging || d.b !== 0) return;
    const h = pick(e.clientX, e.clientY);
    if (!h) { select(null); return; }
    const part = h.object.userData.part;
    if (e.altKey || e.shiftKey) select({ kind: 'asm', ref: part.asm });
    else select({ kind: 'part', ref: part });
  });
  canvas.addEventListener('dblclick', (e) => {
    const h = pick(e.clientX, e.clientY);
    if (h) frameParts([h.object.userData.part]); else frameAll();
  });
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => { lastInteraction = performance.now(); $('#tooltip').hidden = true; });

  window.addEventListener('keydown', (e) => {
    if (e.target.matches('input[type="search"], input[type="text"]')) return;
    if (e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if (k === '/') { e.preventDefault(); $('#tree-panel').classList.remove('closed'); $('#btn-tree').classList.add('on'); updateViewShift(); $('#search').focus(); return; }
    if (k === 'Escape') {
      if (!$('#help').hidden) { $('#help').hidden = true; return; }
      if (tour.active) { stopTour(); return; }
      if (sectionOn && !$('#section-pop').hidden) { $('#section-pop').hidden = true; if (sectionViz) sectionViz.visible = false; dirty = true; return; }
      select(null); return;
    }
    if (tour.active) {
      if (k === 'ArrowRight' || k === ' ') { e.preventDefault(); $('#tour-next').click(); return; }
      if (k === 'ArrowLeft') { $('#tour-prev').click(); return; }
    }
    switch (k.toLowerCase()) {
      case 'e': animateExplode(explode > 0.5 ? 0 : 1); break;
      case 's': setSection(!sectionOn); break;
      case 'x': toggleXray(); break;
      case 'r': toggleRotate(); break;
      case 't': tour.active ? stopTour() : startTour(); break;
      case 'f': selection ? frameParts(partsOf(selection)) : frameAll(); break;
      case 'i': if (selection) isolate(selection); break;
      case 'h': if (e.shiftKey) { showAll(); } else if (selection) hideSel(selection); break;
      case 'p': screenshot(); break;
      case '?': $('#help').hidden = !$('#help').hidden; break;
      case '1': frameAll(VIEWS.iso); break;
      case '2': frameAll(VIEWS.front); break;
      case '3': frameAll(VIEWS.side); break;
      case '4': frameAll(VIEWS.top); break;
      default: return;
    }
  });
  window.addEventListener('resize', onResize);
}

function onResize() {
  const w = Math.max(1, window.innerWidth || canvas.clientWidth), h = Math.max(1, window.innerHeight || canvas.clientHeight);
  renderer.setSize(w, h, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(w, h);
  camera.aspect = w / h;
  updateViewShift(); applyViewShift(true);
  camera.updateProjectionMatrix();
  if (sectionOn && !$('#section-pop').hidden) placePop();
  dirty = true;
}

// keep the model centred in the space not covered by the side panel
let viewShift = 0, viewShiftTarget = 0;
function updateViewShift() {
  const panel = $('#tree-panel');
  const open = !panel.classList.contains('closed') && !app.classList.contains('touring') && window.innerWidth > 760;
  viewShiftTarget = open ? panel.getBoundingClientRect().right / 2 : 0;
}
function applyViewShift(snap) {
  if (!snap && Math.abs(viewShift - viewShiftTarget) < 0.5) return false;
  viewShift = snap ? viewShiftTarget : viewShift + (viewShiftTarget - viewShift) * 0.14;
  const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
  if (Math.abs(viewShift) < 0.5) camera.clearViewOffset(); else camera.setViewOffset(w, h, -viewShift, 0, w, h);
  return true;
}

// ────────────────────────────────────────────────────────────── loop
let aoOnMotion = true, lastRender = 0, aoPending = false;
function frame(now) {
  requestAnimationFrame(frame);
  try { tick(now); } catch (err) { console.error(err); }
}
function tick(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const k = Math.min(1, (now - tw.t0) / tw.dur);
    tw.fn(k);
    if (k >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
    dirty = true;
  }
  if (controls.update()) dirty = true;
  if (controls.autoRotate) dirty = true;
  if (applyViewShift(false)) dirty = true;

  // tour autoplay
  if (tour.active && tour.playing) {
    const cur = $('#tour-dots i.cur');
    const p = (now - tour.t0) / TOUR_STEP_MS;
    if (cur) cur.style.setProperty('--t', Math.min(1, p).toFixed(3));
    if (p >= 1) { if (tour.i < steps.length - 1) gotoStep(tour.i + 1); else { tour.playing = false; setIcon($('#tour-play'), 'play'); } }
  }

  // hover picking
  if (pointer.moved && pointer.inside && !pointer.down) {
    pointer.moved = false;
    const h = pick(pointer.x, pointer.y);
    const tip = $('#tooltip');
    if (h) {
      const part = h.object.userData.part;
      setHover([part]);
      tip.hidden = false;
      tip.querySelector('.tt-name').textContent = part.name + (part.count > 1 ? `  ×${part.count}` : '');
      tip.querySelector('.tt-sub').textContent = part.group ? `${part.group.name} · ${part.asm.name}` : part.asm.name;
      const tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = `${Math.min(pointer.x, window.innerWidth - tw - 24)}px`;
      tip.style.top = `${Math.min(pointer.y, window.innerHeight - th - 24)}px`;
      canvas.classList.add('hovering');
    } else {
      setHover(null); tip.hidden = true; canvas.classList.remove('hovering');
    }
  }

  const aoAllowed = !(tour.active && tour.focus) && !xray && !sectionOn;
  if (dirty) {
    // on slower GPUs ambient occlusion is skipped while things move and added once the view settles
    const continuous = now - lastRender < 70 || tweens.length > 0 || controls.autoRotate;
    gtao.enabled = aoAllowed && (aoOnMotion || !continuous);
    if (shadowDirty) { renderer.shadowMap.needsUpdate = true; shadowDirty = false; }
    composer.render();
    dirty = false; lastRender = now;
    aoPending = aoAllowed && !gtao.enabled;
  } else if (aoPending && now - lastRender > 160) {
    gtao.enabled = true; composer.render(); aoPending = false;
  }
}

// time a full frame with and without AO once, to decide whether AO can run during motion
function benchmark() {
  const gl = renderer.getContext(); const px = new Uint8Array(4);
  const time = (n) => {
    composer.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) { composer.render(); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
    return (performance.now() - t0) / n;
  };
  gtao.enabled = true; const withAO = time(2);
  aoOnMotion = withAO < 24;
  return withAO;
}

// ────────────────────────────────────────────────────────────── boot
(async function boot() {
  try {
    wireUI();
    onResize();
    await loadModel();
    const st = meta.stats;
    $('#model-title').textContent = 'Rabbitbot';
    $('#model-stats').innerHTML = `<span><b>${asms.length}</b> assemblies</span><span><b>${fmt(parts.length)}</b> parts</span><span><b>${fmt(st.bodies)}</b> bodies</span><span><b>${(st.totalTris / 1e6).toFixed(2)}M</b> triangles</span>`;
    buildTree();
    syncTreeVisibility();
    onResize();
    // intro: start wide and swoop in
    const s = worldBox.getBoundingSphere(new THREE.Sphere());
    const d0 = VIEWS.iso.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -0.9).normalize();
    camera.position.copy(s.center).addScaledVector(d0.setY(0.35).normalize(), fitDistance(s.radius) * 2.2);
    controls.target.copy(s.center);
    controls.update();
    renderer.shadowMap.needsUpdate = true;
    benchmark();
    requestAnimationFrame(frame);
    setTimeout(() => {
      $('#loader').classList.add('done');
      frameBox(worldBox, VIEWS.iso, 1.02, 2200);
    }, 150);
  } catch (err) {
    console.error(err);
    $('#loader-status').textContent = `Could not load the model: ${err.message}`;
  }
})();
