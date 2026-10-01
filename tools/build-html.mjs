// Bundles the viewer (three.js + app code), inlines CSS and the packed model into one standalone HTML file.
import fs from 'node:fs';
import path from 'node:path';
import * as esbuild from 'esbuild';

const OUT = process.argv[2] || '../Rabbitbot Viewer.html';

const js = await esbuild.build({
  entryPoints: ['src/main.js'],
  bundle: true,
  format: 'iife',
  minify: true,
  target: ['chrome110', 'firefox115', 'safari16.4'],
  write: false,
  legalComments: 'none',
  logLevel: 'warning',
});
const code = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = (await esbuild.transform(fs.readFileSync('src/style.css', 'utf8'), { loader: 'css', minify: true })).code;
const model = fs.readFileSync('out/model.bin.gz').toString('base64');

let html = fs.readFileSync('src/template.html', 'utf8');
html = html.replace('/*CSS*/', () => css).replace('/*MODEL*/', () => model).replace('/*JS*/', () => code);
fs.writeFileSync(OUT, html);
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`${path.resolve(OUT)}\n  js ${kb(code.length)}  css ${kb(css.length)}  model ${kb(model.length)}  total ${(html.length / 1048576).toFixed(2)} MB`);
