// Turns the cached OpenCascade tessellation into a compact, instanced model blob.
//   - splits meshes by B-rep face colour
//   - detects identical geometry under rigid transforms -> GPU instancing
//   - quantises + meshopt-encodes + deflates everything into model.bin
import fs from 'node:fs';
import zlib from 'node:zlib';
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';

await MeshoptEncoder.ready;
await MeshoptSimplifier.ready;
// geometric error allowed when simplifying (mm) - far below anything visible, but cuts ~1/3 of the triangles
const SIMPLIFY_ERROR = 0.02;

const meta = JSON.parse(fs.readFileSync('cache.json', 'utf8'));
const bin = fs.readFileSync('cache.bin');
const view = (T, [off, len]) => new T(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + len * T.BYTES_PER_ELEMENT));

// ---------- names ----------
const ASM_NAMES = {
  'rabbitwheel v49': 'Omni Wheel',
  'kicker v6': 'Solenoid Kicker',
  'base plate': 'Base Plate',
  'shell': 'Shell',
  'lid': 'Lid',
  'Raspberry PI 4 Model B': 'Raspberry Pi 4 Model B',
  'mjbots-power_dist-r43b': 'mjbots Power Distribution r4.3b',
  'mjbots-pi3hat-r4-4': 'mjbots pi3hat r4.4',
  'mid plate': 'Mid Plate',
  'battery': 'Battery',
  'Golfball': 'Golf Ball',
  'kicker assembly': 'Kicker Assembly',
  'Dribbler Prototype': 'Dribbler',
  'CAPACITOR': 'Capacitor',
  'Battery Holder': 'Battery Holder',
};
const PN = /(?<![A-Za-z0-9])\d{4,5}[A-Z]\d{1,4}(?![A-Za-z0-9])/;
const GENERIC = /^(SOLID|COMPOUND|Body\d*|Component\d*|)$/i;
const FIXES = [[/Solonoid/g, 'Solenoid'], [/Plundger/g, 'Plunger'], [/^subwheel$/i, 'Subwheel (roller)']];
function tidy(n) {
  let s = n.replace(/, RPi4ModelB$/, '').replace(/\s*\(\d+\)\s*$/, '').replace(/_\d+$/, '');
  s = s.replace(new RegExp(PN.source, 'g'), '').replace(/_/g, ' ').replace(/\s+v\d+$/i, '').replace(/\s+v\d+(?=\s)/gi, '');
  s = s.replace(/\s{2,}/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '').trim();
  for (const [re, to] of FIXES) s = s.replace(re, to);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
const pnOf = (n) => (n.match(PN) || [])[0] || null;
const names = JSON.parse(fs.readFileSync('names.json', 'utf8'));
function describe(mi, asmBase) {
  const e = names[mi]; const path = e.path;
  const group = path.length >= 4 ? tidy(path[2]) : null;
  let li = path.length - 1;
  while (li > 1 && GENERIC.test(path[li])) li--;
  const raw = li > 1 ? path[li] : null;
  return { group, name: raw ? tidy(raw) || asmBase : asmBase, pn: raw ? pnOf(raw) : null, occ: e.o };
}

// ---------- flatten tree to (assembly, mesh) ----------
const top = meta.root.children.length === 1 && meta.root.children[0].children.length ? meta.root.children[0] : meta.root;
const asms = [];
const asmCount = {};
for (const node of top.children) {
  const base = ASM_NAMES[node.name] || node.name;
  asmCount[base] = (asmCount[base] || 0) + 1;
  const all = [];
  (function walk(n) { all.push(...n.meshes); n.children.forEach(walk); })(node);
  asms.push({ raw: node.name, base, meshes: all });
}
const asmSeen = {};
for (const a of asms) {
  if (asmCount[a.base] > 1) { asmSeen[a.base] = (asmSeen[a.base] || 0) + 1; a.name = `${a.base} ${asmSeen[a.base]}`; }
  else a.name = a.base;
}
if (top.meshes.length) asms.push({ raw: top.name, name: top.name, base: top.name, meshes: top.meshes });

// ---------- split by face colour ----------
const DEFAULT = [0.78, 0.79, 0.8];
const colKey = (c) => (c || DEFAULT).map((v) => Math.round(v * 255)).join(',');
const subs = []; // {asm, rawName, color, pos(F32), nrm(F32), idx(U32)}
for (let ai = 0; ai < asms.length; ai++) {
  for (const mi of asms[ai].meshes) {
    const m = meta.meshes[mi];
    const pos = view(Float32Array, m.pos), nrm = view(Float32Array, m.nrm), idx = view(Uint32Array, m.idx);
    const byColor = new Map();
    for (const [first, last, fc] of m.faces) {
      const c = fc || m.color || DEFAULT;
      const k = colKey(c);
      if (!byColor.has(k)) byColor.set(k, { color: c, tris: [] });
      byColor.get(k).tris.push([first, last]);
    }
    if (!m.faces.length) byColor.set(colKey(m.color), { color: m.color || DEFAULT, tris: [[0, idx.length / 3 - 1]] });
    for (const { color, tris } of byColor.values()) {
      let n = 0; for (const [a, b] of tris) n += b - a + 1;
      const sub = new Uint32Array(n * 3); let o = 0;
      for (const [a, b] of tris) { sub.set(idx.subarray(a * 3, (b + 1) * 3), o); o += (b - a + 1) * 3; }
      // compact vertices
      const map = new Map(); const out = new Uint32Array(sub.length); const vs = [];
      for (let i = 0; i < sub.length; i++) { let v = map.get(sub[i]); if (v === undefined) { v = vs.length; map.set(sub[i], v); vs.push(sub[i]); } out[i] = v; }
      const p = new Float32Array(vs.length * 3), q = new Float32Array(vs.length * 3);
      vs.forEach((v, i) => { p.set(pos.subarray(v * 3, v * 3 + 3), i * 3); q.set(nrm.subarray(v * 3, v * 3 + 3), i * 3); });
      subs.push({ asm: ai, mi, rawName: m.name, color, pos: p, nrm: q, idx: out });
    }
  }
}

// ---------- rigid-instance detection ----------
function hashIdx(a) { let h = 2166136261 >>> 0; for (let i = 0; i < a.length; i += 1) { h ^= a[i]; h = Math.imul(h, 16777619) >>> 0; } return h; }
function pickFrame(p) {
  // three well-spread vertex ids, chosen deterministically from the representative
  const n = p.length / 3; let a = 0, b = 0, bd = -1;
  for (let i = 0; i < n; i++) { const d = (p[i*3]-p[0])**2 + (p[i*3+1]-p[1])**2 + (p[i*3+2]-p[2])**2; if (d > bd) { bd = d; b = i; } }
  let c = 0, cd = -1;
  for (let i = 0; i < n; i++) {
    const ux = p[b*3]-p[0], uy = p[b*3+1]-p[1], uz = p[b*3+2]-p[2];
    const vx = p[i*3]-p[0], vy = p[i*3+1]-p[1], vz = p[i*3+2]-p[2];
    const cx = uy*vz-uz*vy, cy = uz*vx-ux*vz, cz = ux*vy-uy*vx; const d = cx*cx+cy*cy+cz*cz;
    if (d > cd) { cd = d; c = i; }
  }
  return [a, b, c, cd];
}
function frameOf(p, [a, b, c]) {
  const o = [p[a*3], p[a*3+1], p[a*3+2]];
  let u = [p[b*3]-o[0], p[b*3+1]-o[1], p[b*3+2]-o[2]];
  let w = [p[c*3]-o[0], p[c*3+1]-o[1], p[c*3+2]-o[2]];
  const nu = Math.hypot(...u); u = u.map((x) => x / nu);
  let z = [u[1]*w[2]-u[2]*w[1], u[2]*w[0]-u[0]*w[2], u[0]*w[1]-u[1]*w[0]]; const nz = Math.hypot(...z); z = z.map((x) => x / nz);
  const y = [z[1]*u[2]-z[2]*u[1], z[2]*u[0]-z[0]*u[2], z[0]*u[1]-z[1]*u[0]];
  return { o, F: [u, y, z] }; // rows = basis vectors
}
function rigid(rep, other) {
  if (rep.frameIds[3] < 1e-12) return null;
  const A = frameOf(rep.pos, rep.frameIds), B = frameOf(other.pos, rep.frameIds);
  // R = B^T * A  (maps A-frame coords to B-frame coords)
  const R = [[0,0,0],[0,0,0],[0,0,0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let s = 0; for (let k = 0; k < 3; k++) s += B.F[k][i] * A.F[k][j]; R[i][j] = s; }
  const t = [0,1,2].map((i) => B.o[i] - (R[i][0]*A.o[0] + R[i][1]*A.o[1] + R[i][2]*A.o[2]));
  const p = rep.pos, q = other.pos, tol = 2e-3;
  for (let v = 0; v < p.length; v += 3) {
    for (let i = 0; i < 3; i++) {
      const x = R[i][0]*p[v] + R[i][1]*p[v+1] + R[i][2]*p[v+2] + t[i];
      if (Math.abs(x - q[v+i]) > tol) return null;
    }
  }
  // column-major 4x3 affine (three.js Matrix4 elements minus the last row)
  return [R[0][0], R[1][0], R[2][0], R[0][1], R[1][1], R[2][1], R[0][2], R[1][2], R[2][2], t[0], t[1], t[2]];
}

const buckets = new Map();
const geoms = []; // {rep sub, instances: [{sub, m}]}
for (const s of subs) {
  const key = `${s.pos.length}/${s.idx.length}/${hashIdx(s.idx)}`;
  let list = buckets.get(key); if (!list) buckets.set(key, (list = []));
  let placed = false;
  for (const g of list) {
    const m = rigid(g.rep, s);
    if (m) { g.instances.push({ sub: s, m }); placed = true; break; }
  }
  if (!placed) {
    s.frameIds = pickFrame(s.pos);
    const g = { rep: s, instances: [{ sub: s, m: [1,0,0,0,1,0,0,0,1,0,0,0] }] };
    list.push(g); geoms.push(g);
  }
}

// ---------- parts: (assembly, sub-assembly, clean name) ; each part has per-(geom,color) batches ----------
// sanity: occt mesh order must match the OCP traversal order
for (let mi = 0; mi < meta.meshes.length; mi++) {
  if (!names[mi]) throw new Error('names.json does not match cache (run names.py)');
}
const parts = []; const partByKey = new Map();
const groupList = []; const groupByKey = new Map();
for (let gi = 0; gi < geoms.length; gi++) {
  for (const inst of geoms[gi].instances) {
    const s = inst.sub; const asm = asms[s.asm];
    const d = describe(s.mi, asm.base);
    let gid = -1;
    if (d.group) {
      const gk = `${s.asm}|${d.group}`;
      if (!groupByKey.has(gk)) { groupByKey.set(gk, groupList.length); groupList.push({ asm: s.asm, name: d.group }); }
      gid = groupByKey.get(gk);
    }
    const key = `${s.asm}|${gid}|${d.name}`;
    let part = partByKey.get(key);
    if (!part) { part = { asm: s.asm, group: gid, name: d.name, pn: d.pn, hint: new Set(), batches: new Map(), occ: new Set() }; partByKey.set(key, part); parts.push(part); }
    part.occ.add(d.occ);
    if (s.rawName && !GENERIC.test(s.rawName)) part.hint.add(s.rawName);
    const bk = `${gi}|${colKey(s.color)}`;
    if (!part.batches.has(bk)) part.batches.set(bk, { g: gi, color: s.color.map((v) => +v.toFixed(4)), m: [] });
    part.batches.get(bk).m.push(...inst.m.map((v) => +v.toFixed(5)));
  }
}
for (const p of parts) p.count = p.occ.size;

// ---------- encode geometry ----------
const chunks = []; let off = 0;
const put = (u8) => { chunks.push(Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)); const r = [off, u8.byteLength]; off += u8.byteLength; while (off % 4) { chunks.push(Buffer.alloc(1)); off++; } return r; };
const geomOut = [];
let totalTris = 0, uniqueTris = 0;
for (const g of geoms) {
  const s = g.rep;
  const [idx] = MeshoptSimplifier.simplify(new Uint32Array(s.idx), s.pos, 3, 0, SIMPLIFY_ERROR, ['ErrorAbsolute']);
  const [remap, nv] = MeshoptEncoder.reorderMesh(idx, true, false);
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 4);
  for (let i = 0; i < remap.length; i++) {
    const r = remap[i]; if (r === 0xffffffff) continue;
    pos.set(s.pos.subarray(i * 3, i * 3 + 3), r * 3);
    const nx = s.nrm[i*3], ny = s.nrm[i*3+1], nz = s.nrm[i*3+2]; const l = Math.hypot(nx, ny, nz) || 1;
    nrm[r*4] = nx / l; nrm[r*4+1] = ny / l; nrm[r*4+2] = nz / l;
  }
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const v = pos[i*3+k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
  const q = new Uint16Array(nv * 4);
  for (let i = 0; i < nv; i++) for (let k = 0; k < 3; k++) { const e = mx[k] - mn[k] || 1; q[i*4+k] = Math.round(((pos[i*3+k] - mn[k]) / e) * 65535); }
  const P = put(MeshoptEncoder.encodeVertexBuffer(new Uint8Array(q.buffer), nv, 8));
  const N = put(MeshoptEncoder.encodeVertexBuffer(MeshoptEncoder.encodeFilterOct(nrm, nv, 4, 8), nv, 4));
  const isz = nv < 65536 ? 2 : 4;
  const ib = isz === 2 ? new Uint16Array(idx) : idx;
  const I = put(MeshoptEncoder.encodeIndexBuffer(new Uint8Array(ib.buffer), idx.length, isz));
  geomOut.push({ v: nv, i: idx.length, isz, min: mn.map((v) => +v.toFixed(5)), max: mx.map((v) => +v.toFixed(5)), P, N, I });
  uniqueTris += idx.length / 3; totalTris += (idx.length / 3) * g.instances.length;
}

const out = {
  title: top.name,
  source: 'rabbitbot published.step',
  assemblies: asms.map((a) => ({ name: a.name, base: a.base, raw: a.raw })),
  geoms: geomOut,
  groups: groupList,
  parts: parts.map((p) => ({ asm: p.asm, group: p.group, name: p.name, pn: p.pn, hint: [...p.hint].join(' '), count: p.count, batches: [...p.batches.values()] })),
  stats: { bodies: subs.length, uniqueGeoms: geoms.length, totalTris, uniqueTris },
};
const json = Buffer.from(JSON.stringify(out));
const body = Buffer.concat(chunks);
const header = Buffer.alloc(8); header.writeUInt32LE(json.length, 0); header.writeUInt32LE(body.length, 4);
const pad = Buffer.alloc((4 - ((8 + json.length) % 4)) % 4, 0x20);
const raw = Buffer.concat([header, json, pad, body]);
header.writeUInt32LE(json.length + pad.length, 0);
const packed = zlib.gzipSync(Buffer.concat([header, json, pad, body]), { level: 9 });
fs.mkdirSync('out', { recursive: true });
fs.writeFileSync('out/model.bin.gz', packed);
console.log(`assemblies ${asms.length}  groups ${groupList.length}  parts ${parts.length}  bodies ${subs.length}  unique geoms ${geoms.length}`);
console.log(`triangles: rendered ${totalTris.toLocaleString()}  unique ${uniqueTris.toLocaleString()}`);
console.log(`raw ${(raw.length / 1e6).toFixed(2)} MB  gz ${(packed.length / 1e6).toFixed(2)} MB  json ${(json.length / 1e3).toFixed(0)} KB`);
