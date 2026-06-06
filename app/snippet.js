// app/snippet.js — build a single self-contained ES module for one control,
// inlining its core/ dependencies (spec requirement 6, arch decision 2026-06-06).
//
// Strategy: fetch the control source + every core module (same-origin, served
// locally), strip all `import ...` lines, concatenate core (deps first) then the
// control body, and re-export the factory. The result imports cleanly into any
// project with no sibling files. No bundler — plain string assembly.

const CORE_FILES = [
  'core/map.js',
  'core/gesture.js',
  'core/geometry.js',
  'core/a11y.js',
  'core/control.js',
];

// Remove ES import statements (single- and multi-line) and bare `export default`
// re-export of the factory (we keep named `export function`).
function stripImports(src) {
  // drop multi-line and single-line import statements
  let out = src.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
  out = out.replace(/^\s*import\s+['"][^'"]+['"];?\s*$/gm, '');
  return out;
}

// `export function foo` / `export const foo` -> `function foo` / `const foo`
// so inlined core symbols live in one module scope without duplicate exports.
function deExport(src) {
  return src.replace(/^\s*export\s+(function|const|let|class)\s/gm, '$1 ');
}

async function fetchText(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return res.text();
}

// reg: a registry entry. Returns { filename, code }.
export async function buildSnippet(reg) {
  const base = new URL('.', document.baseURI); // project root
  const coreSrcs = await Promise.all(
    CORE_FILES.map((f) => fetchText(new URL(f, base).href))
  );
  const ctrlSrc = await fetchText(new URL(`controls/${reg.module}.js`, base).href);

  const coreInlined = coreSrcs
    .map((s) => deExport(stripImports(s)))
    .join('\n');

  // control: strip imports, de-export named factory, drop trailing default export
  let ctrl = stripImports(ctrlSrc);
  ctrl = ctrl.replace(/^\s*export\s+default\s+[A-Za-z0-9_$]+;?\s*$/gm, '');
  // keep the public factory exported: `export function NAME` stays as-is.

  const header = `// ${reg.title} (${reg.name}) — geejisuraidaa snippet.
// Self-contained ES module: core deps inlined, no sibling files required.
//
// USAGE:
//   import { ${reg.export} } from './${reg.module}.snippet.js';
//   const handle = ${reg.export}(document.querySelector('#mount'), {
//     min: ${reg.opts.min}, max: ${reg.opts.max}, step: ${reg.opts.step},
//     value: ${JSON.stringify(reg.opts.value)},
//     onInput: v => console.log(v),
//   });
//   // handle => { get(), set(v), on(cb), destroy(), el, opts }
//
// Contract: control(el, opts) -> handle  (spec §4). Core deps inlined below;
// no sibling files required. Needs styles for the .mp-* classes (see styles.css).
// Generated ${new Date().toISOString()}.
'use strict';

// ===== inlined core/ =====================================================
${coreInlined}

// ===== control: ${reg.module} ============================================
${ctrl}
`;

  return { filename: `${reg.module}.snippet.js`, code: header };
}

// trigger a client-side download of arbitrary text.
export function download(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
