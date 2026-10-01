# Kaninchen Viewer

An interactive 3D viewer for **Rabbitbot**, an omnidirectional soccer robot. The full CAD assembly is packed into a single, self-contained HTML file. You can open it in a browser with no install, no server and no internet connection.

**[Rabbitbot Viewer.html](Rabbitbot%20Viewer.html)** (2.5 MB). Download it and double-click.

## What you can do

- **Browse the assembly.** All 18 top-level assemblies, 178 unique parts and 4,530 bodies are listed in a searchable tree that follows the original CAD structure. Hardware shows its McMaster-Carr part number.
- **Inspect parts.** Click any part to see its quantity, envelope dimensions, finish and triangle count, then focus, isolate or hide it.
- **Explode the robot.** A slider separates the enclosure, electronics stack, wheels and rollers.
- **Cut a section.** Slice along X, Y or Z. Cut faces are shaded so internal geometry is easy to read.
- **X-ray.** Ghost everything except the selection.
- **Take the guided tour.** An 11-step walkthrough of the drive modules, kickers, dribbler, electronics, power and chassis. It can play on its own or be stepped through.
- **Present.** Light and dark studio backgrounds, turntable rotation, PNG screenshots and fullscreen.

## Controls

| Input | Action |
| --- | --- |
| Left drag / right drag / scroll | Orbit / pan / zoom to cursor |
| Click / double-click | Select part / frame part |
| Shift + click | Select the whole assembly |
| `E` | Explode or collapse |
| `S` | Section cut |
| `X` | X-ray |
| `I` / `H` / `Shift H` | Isolate / hide selection / show everything |
| `F` | Frame selection |
| `1` `2` `3` `4` | Iso, front, side, top view |
| `T` | Guided tour (`←` `→` to step) |
| `R` | Turntable |
| `P` | Save screenshot |
| `/` | Search parts |
| `?` | Show all shortcuts |

## Browser support

The viewer needs WebGL 2 and `DecompressionStream`. It works in current versions of Chrome, Edge, Firefox and Safari (16.4+). It was tested on a Snapdragon X laptop with integrated graphics.

## How it works

The source model is a 45 MB STEP export (`rabbitbot published.step`). Browsers can't read STEP directly, so a build step converts it once into a compact mesh format that is embedded in the HTML.

1. **Tessellation.** [occt-import-js](https://github.com/kovacsv/occt-import-js) (OpenCascade compiled to WebAssembly) meshes every solid. This gives 4.4M triangles.
2. **Component names.** occt-import-js flattens sub-assemblies, so a second pass with OpenCascade's Python bindings ([OCP](https://github.com/CadQuery/OCP)) reads the full product tree. Its traversal order matches the mesher's, which lets every body be mapped back to its component path and occurrence. Quantities count real parts, not sub-bodies.
3. **Instancing.** Many bodies are rigid copies of each other: four identical wheels, 30 rollers per wheel, every screw and bearing. The build detects these by comparing topology and then solving for the rigid transform between copies. 4,530 bodies reduce to 205 unique geometries, and each is drawn with GPU instancing.
4. **Simplification and compression.** Each unique geometry is simplified within a 0.02 mm error bound with [meshoptimizer](https://github.com/zeux/meshoptimizer). That cuts about a third of the triangles with no visible change. Positions are quantised to 16 bits, normals are octahedrally encoded, and everything is meshopt-encoded and gzipped. The whole robot ends up as 1.4 MB of data.
5. **Bundling.** The viewer ([three.js](https://threejs.org), [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) for picking) is bundled with esbuild and inlined into the HTML together with the model as base64.

At runtime the page renders only when something changes. It benchmarks the GPU on load. On slower hardware, ambient occlusion is skipped while the camera moves and added back once the view settles.

## Rebuilding

Rebuild after changing the STEP file or the viewer source. Requires Node 20+ and Python 3.10+.

```bash
cd tools
npm install
python -m venv .venv
.venv/Scripts/python -m pip install cadquery-ocp   # use .venv/bin/python on macOS/Linux
npm run tessellate   # STEP -> cache.bin / cache.json    (a few minutes)
npm run names        # STEP -> names.json (component tree)
npm run build        # -> ../Rabbitbot Viewer.html
```

If you only changed the viewer (`tools/src/`), `npm run html` is enough. Tour captions are in `tools/src/tour.js`. Display names for assemblies are mapped in `tools/build-data.mjs`.

On macOS or Linux, change the `names` script in `tools/package.json` to use `.venv/bin/python`.

## Repository layout

```
Rabbitbot Viewer.html     the built viewer
rabbitbot published.step  source CAD
tools/
  extract.cjs             tessellation (occt-import-js)
  names.py                component tree extraction (OCP)
  build-data.mjs          instancing, simplification, compression
  build-html.mjs          bundling into a single HTML file
  src/                    viewer source: main.js, tour.js, style.css, template.html
```

## Acknowledgements

Built on [three.js](https://github.com/mrdoob/three.js), [meshoptimizer](https://github.com/zeux/meshoptimizer) and [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) (all MIT). Tessellation and STEP parsing at build time use [Open CASCADE Technology](https://dev.opencascade.org) through [occt-import-js](https://github.com/kovacsv/occt-import-js) and [OCP](https://github.com/CadQuery/OCP) (LGPL 2.1). None of the OpenCascade code ships in the viewer.
