// controls/xypad.js — 2D pad (two correlated values at once)
//
// AXES (spec §1)
//   Acquisition: gestural/positional — pointer → (x,y), absolute placement.
//   Mapping:     linear per axis. norm (x,y) in [0,1]², remapped to [min,max]².
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: position / vector / pan-tilt — two coupled params
// in one gesture; dbl-click recenters. The contract's 2-vector case (spec §9
// `dims`): get()/set() take and return [x,y].
//
// Conventions: dbl-click reset, keyboard (arrows move the dot), typeable XY
// readouts (full-width digits), units, role=slider (2D announced via valuetext).

import { parseNumberLoose, makeFormat } from '../core/control.js';
import { clamp } from '../core/map.js';
import { beginTrack, resolveModifier } from '../core/gesture.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function xypad(el, opts = {}) {
  const o = {
    min: -1, max: 1, step: 0.01,
    value: [0, 0], default: undefined,
    map: 'lin', commit: 'live', unit: '',
    dims: 2, label: 'xy',
    ...opts,
  };
  if (o.default === undefined) o.default = Array.isArray(o.value) ? o.value.slice() : [0, 0];
  const fmt = o.format || makeFormat({ step: o.step, unit: o.unit });
  const subs = new Set();

  const span = o.max - o.min;
  const clampPair = (p) => [clamp(p[0], o.min, o.max), clamp(p[1], o.min, o.max)];
  let val = clampPair(Array.isArray(o.value) ? o.value : [0, 0]);

  el.classList.add('mp-xypad');
  el.innerHTML = `
    <div class="mp-xy-field" tabindex="0"><div class="mp-xy-dot"></div>
      <div class="mp-xy-cross-h"></div><div class="mp-xy-cross-v"></div></div>
    <div class="mp-xy-row">
      <span class="mp-xy-lab">x</span><input class="mp-xy-x" type="text" inputmode="decimal" />
      <span class="mp-xy-lab">y</span><input class="mp-xy-y" type="text" inputmode="decimal" />
    </div>`;
  const field = el.querySelector('.mp-xy-field');
  const dot = el.querySelector('.mp-xy-dot');
  const inX = el.querySelector('.mp-xy-x');
  const inY = el.querySelector('.mp-xy-y');

  wireSlider(field, { min: o.min, max: o.max, label: o.label });

  const toNorm = (v) => (v - o.min) / span; // y: top = max
  function render(kind) {
    const nx = toNorm(val[0]);
    const ny = toNorm(val[1]);
    dot.style.left = `${nx * 100}%`;
    dot.style.top = `${(1 - ny) * 100}%`;
    if (document.activeElement !== inX) inX.value = fmt(val[0]);
    if (document.activeElement !== inY) inY.value = fmt(val[1]);
    updateAria(field, { norm: nx, text: `x ${fmt(val[0])}, y ${fmt(val[1])}` });
    for (const cb of subs) cb(val.slice(), kind || 'input');
  }

  function emit(kind) {
    if (kind === 'input' && o.onInput) o.onInput(val.slice());
    if (kind === 'change' && o.onChange) o.onChange(val.slice());
  }
  function setVal(p, { commit = false, kind = 'input' } = {}) {
    val = clampPair([
      Number(p[0].toFixed(6)),
      Number(p[1].toFixed(6)),
    ]);
    render(kind);
    if (kind !== 'set') emit(kind);
  }

  function fromXY(cx, cy) {
    const r = field.getBoundingClientRect();
    const nx = clamp((cx - r.left) / r.width, 0, 1);
    const ny = clamp(1 - (cy - r.top) / r.height, 0, 1);
    setVal([o.min + nx * span, o.min + ny * span], { kind: 'input' });
  }
  const unbind = beginTrack(field, {
    onDown: ({ x, y }) => fromXY(x, y),
    onMove: ({ x, y }) => fromXY(x, y),
    onUp: () => { emit('change'); },
  });

  field.addEventListener('dblclick', () => {
    setVal(o.default.slice(), { kind: 'change' });
    emit('change');
  });

  function bindEntry(input, idx) {
    const commitEdit = () => {
      const v = parseNumberLoose(input.value);
      if (Number.isFinite(v)) {
        const p = val.slice(); p[idx] = v; setVal(p, { kind: 'change' }); emit('change');
      } else render();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { commitEdit(); input.blur(); }
      else if (e.key === 'Escape') render();
    });
    input.addEventListener('blur', commitEdit);
  }
  bindEntry(inX, 0); bindEntry(inY, 1);

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    const p = val.slice();
    const mod = resolveModifier(e);
    const s = o.step * mod;
    if (e.key === 'ArrowLeft') p[0] -= s;
    else if (e.key === 'ArrowRight') p[0] += s;
    else if (e.key === 'ArrowUp') p[1] += s;
    else if (e.key === 'ArrowDown') p[1] -= s;
    else if (d === 'min') { p[0] = o.min; p[1] = o.min; }
    else if (d === 'max') { p[0] = o.max; p[1] = o.max; }
    setVal(p, { kind: 'change' }); emit('change');
  }
  field.addEventListener('keydown', onKey);

  render('set');

  return {
    el,
    get: () => val.slice(),
    set: (p) => { setVal(Array.isArray(p) ? p : [p, p], { kind: 'set' }); return val.slice(); },
    on: (cb) => { subs.add(cb); return () => subs.delete(cb); },
    destroy() { subs.clear(); unbind(); field.removeEventListener('keydown', onKey); el.classList.remove('mp-xypad'); },
    opts: o,
  };
}

export default xypad;
