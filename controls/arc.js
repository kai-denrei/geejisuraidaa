// controls/arc.js — arc / radial gauge (absolute, tap-to-jump)
//
// AXES (spec §1)
//   Acquisition: positional (ABSOLUTE). 180° top arc (180°→360°). Pointer angle
//                ang = atan2(dy, dx) rel. to center; clamp lower half to nearest
//                end; n = (ang−180)/180; tap-to-jump. (spec §5)
//   Mapping:     linear (per opts.map).
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: doubles as a readable gauge — fast to set roughly,
// at-a-glance state. Good for "where in range" plus a live dial readout.
//
// Conventions: dbl-click reset, keyboard, typeable readout (full-width digits),
// units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { beginTrack } from '../core/gesture.js';
import { polar, arc as arcPath } from '../core/geometry.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function arcGauge(el, opts = {}) {
  const model = createModel(opts);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);

  const cx = 50, cy = 50, R = 40;
  el.classList.add('mp-arc');
  if (o.variant) el.classList.add('mp-v-' + o.variant);
  // Readout ABOVE the gauge (finger/cursor never hides it).
  el.innerHTML = `
    <div class="mp-arc-row">
      <span class="mp-arc-readout"></span>
      <input class="mp-arc-input" type="text" inputmode="decimal" hidden/>
    </div>
    <svg viewBox="0 0 100 60" class="mp-arc-svg" tabindex="0">
      <path class="mp-arc-bg" d="${arcPath(cx, cy, R, 180, 360)}" fill="none"/>
      <path class="mp-arc-fill" fill="none"/>
      <circle class="mp-arc-knob" r="4"/>
    </svg>`;
  const svg = el.querySelector('.mp-arc-svg');
  const fillP = el.querySelector('.mp-arc-fill');
  const dot = el.querySelector('.mp-arc-knob');
  const readout = el.querySelector('.mp-arc-readout');
  const input = el.querySelector('.mp-arc-input');

  wireSlider(svg, { min: o.min, max: o.max, label: o.label });

  function render() {
    const v = model.get();
    const n = clamp(m.toNorm(v), 0, 1);
    const ang = 180 + n * 180;
    fillP.setAttribute('d', n > 0.001 ? arcPath(cx, cy, R, 180, ang) : '');
    // variant 'spectrum': color the sweep red→green by value.
    if (o.variant === 'spectrum') fillP.style.stroke = `hsl(${Math.round(n * 120)} 70% 50%)`;
    const p = polar(cx, cy, R, ang);
    dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y);
    readout.textContent = model.format(v);
    updateAria(svg, { norm: n, text: model.format(v) });
  }
  model.on(render);

  function fromPointer(x, y) {
    const r = svg.getBoundingClientRect();
    // map client coords into the 100x60 viewBox space
    const vx = ((x - r.left) / r.width) * 100;
    const vy = ((y - r.top) / r.height) * 60;
    const dx = vx - cx, dy = vy - cy;
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI; // −180..180
    if (ang < 0) ang += 360; // 0..360
    // valid sweep is 180..360 (top arc). clamp lower half to nearest end.
    if (ang > 0 && ang < 180) ang = ang < 90 ? 360 : 180;
    const n = clamp((ang - 180) / 180, 0, 1);
    model.apply(m.toValue(n));
  }
  const unbind = beginTrack(svg, {
    onDown: ({ x, y }) => fromPointer(x, y),
    onMove: ({ x, y }) => fromPointer(x, y),
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
  svg.addEventListener('dblclick', () => model.reset());

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else model.apply(model.get() + d);
    model.commit();
  }
  svg.addEventListener('keydown', onKey);

  render();
  return makeHandle(el, model, () => {
    unbind();
    svg.removeEventListener('keydown', onKey);
    el.classList.remove('mp-arc');
  });
}

export default arcGauge;
