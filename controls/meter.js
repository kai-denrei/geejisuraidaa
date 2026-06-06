// controls/meter.js — segmented meter / fill bar (no handle)
//
// AXES (spec §1)
//   Acquisition: positional (absolute). N segments, no thumb; the fill EDGE is
//                the value. level = ceil((x − left)/width * N), clamp 0..N. (§5)
//   Mapping:     linear, quantized to N segments → maps cleanly to quantized
//                params. value = min + (level/N)*(max−min).
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: quantized params and dot-matrix-style readouts —
// the fill edge is the value; no handle to chase, instantly legible as a gauge.
// 量子化された値向け。ハンドル無し、塗りの縁が値。表示器としても明快。
//
// Conventions: dbl-click reset, keyboard (±1 segment), typeable readout
// (full-width digits), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { beginTrack } from '../core/gesture.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function meter(el, opts = {}) {
  const N = opts.segments || 12;
  // step is one segment in value units
  const min = opts.min ?? 0, max = opts.max ?? N;
  const segStep = (max - min) / N;
  const o0 = { min, max, step: segStep, value: opts.value ?? min, ...opts };
  const model = createModel(o0);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);

  el.classList.add('mp-meter');
  el.innerHTML = `
    <div class="mp-meter-bar" tabindex="0">${Array.from({ length: N })
      .map(() => '<div class="mp-meter-seg"></div>').join('')}</div>
    <div class="mp-meter-row">
      <span class="mp-meter-readout"></span>
      <input class="mp-meter-input" type="text" inputmode="decimal" hidden/>
    </div>`;
  const bar = el.querySelector('.mp-meter-bar');
  const segs = [...el.querySelectorAll('.mp-meter-seg')];
  const readout = el.querySelector('.mp-meter-readout');
  const input = el.querySelector('.mp-meter-input');

  wireSlider(bar, { min: o.min, max: o.max, label: o.label });

  function levelOf(v) { return Math.round(clamp(m.toNorm(v), 0, 1) * N); }
  function render() {
    const v = model.get();
    const lvl = levelOf(v);
    segs.forEach((s, i) => s.classList.toggle('on', i < lvl));
    readout.textContent = `${model.format(v)}  ${lvl}/${N}`;
    updateAria(bar, { norm: clamp(m.toNorm(v), 0, 1), text: `${model.format(v)} (${lvl}/${N})` });
  }
  model.on(render);

  function fromX(x) {
    const r = bar.getBoundingClientRect();
    const lvl = clamp(Math.ceil(((x - r.left) / r.width) * N), 0, N);
    model.apply(o.min + (lvl / N) * (o.max - o.min));
  }
  const unbind = beginTrack(bar, {
    onDown: ({ x }) => fromX(x),
    onMove: ({ x }) => fromX(x),
    onUp: () => model.commit(),
  });

  readout.addEventListener('click', () => {
    input.value = model.format(model.get()).replace(o.unit || '', '');
    readout.hidden = true; input.hidden = false; input.focus(); input.select();
  });
  function commitEdit(keep) {
    if (keep) {
      const v = parseNumberLoose(input.value);
      if (Number.isFinite(v)) { model.apply(v); model.commit(); }
    }
    input.hidden = true; readout.hidden = false;
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit(true); else if (e.key === 'Escape') commitEdit(false);
  });
  input.addEventListener('blur', () => commitEdit(true));
  bar.addEventListener('dblclick', () => model.reset());

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else model.apply(model.get() + d); // d is in value units (one segment = step)
    model.commit();
  }
  bar.addEventListener('keydown', onKey);

  render();
  return makeHandle(el, model, () => {
    unbind();
    bar.removeEventListener('keydown', onKey);
    el.classList.remove('mp-meter');
  });
}

export default meter;
