// Tessellate the STEP once with OpenCascade and cache raw meshes to disk.
const fs = require('fs');
const occt = require('occt-import-js');
const SRC = process.argv[2] || '../rabbitbot published.step';
(async () => {
  const o = await occt();
  const r = o.ReadStepFile(new Uint8Array(fs.readFileSync(SRC)), {
    linearUnit: 'millimeter', linearDeflectionType: 'bounding_box_ratio',
    linearDeflection: 0.001, angularDeflection: 0.5,
  });
  if (!r.success) throw new Error('STEP read failed');
  const chunks = []; let off = 0;
  const push = (ta) => { const b = Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength); chunks.push(b); const o0 = off; off += b.length; return [o0, ta.length]; };
  const meshes = r.meshes.map(m => ({
    name: m.name || '', color: m.color || null,
    pos: push(new Float32Array(m.attributes.position.array)),
    nrm: push(new Float32Array(m.attributes.normal.array)),
    idx: push(new Uint32Array(m.index.array)),
    faces: m.brep_faces.map(f => [f.first, f.last, f.color || null]),
  }));
  fs.writeFileSync('cache.bin', Buffer.concat(chunks));
  fs.writeFileSync('cache.json', JSON.stringify({ root: r.root, meshes }));
  console.log('cached', meshes.length, 'meshes,', (off / 1e6).toFixed(1), 'MB');
})();
