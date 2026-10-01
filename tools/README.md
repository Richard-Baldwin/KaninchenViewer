# Viewer build tools

Turns `rabbitbot published.step` into the standalone `Rabbitbot Viewer.html` in the repo root.

```
npm install
python -m venv .venv && .venv/Scripts/python -m pip install cadquery-ocp
npm run tessellate   # OpenCascade (occt-import-js) -> cache.bin / cache.json   (~4 min)
npm run names        # OpenCascade (OCP) component tree -> names.json            (~3 min)
npm run build        # instancing + meshopt compression + bundle -> ../Rabbitbot Viewer.html
```

- `build-data.mjs` finds bodies that are rigid copies of each other (4,530 bodies -> 205 unique
  geometries), simplifies at 0.02 mm, and packs everything with meshopt + gzip (~1.4 MB).
- `src/` is the viewer (three.js). Tour copy lives in `src/tour.js`; after editing anything in
  `src/`, only `npm run html` is needed.
