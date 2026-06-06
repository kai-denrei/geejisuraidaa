// controls/log-slider.js — log-mapped track slider
//
// AXES (spec §1)
//   Acquisition: positional (absolute) — drag/tap the track thumb.
//   Mapping:     log/exponential. value = min*(max/min)^(pos/S),
//                inverse pos = S * ln(v/min)/ln(max/min). (spec §5)
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: fixes wide-range params (iterations, scale,
// frequency) where a linear track crushes the useful low band.
//
// Conventions: shift/alt modifiers on keyboard step, dbl-click reset, keyboard,
// typeable readout (full-width digits), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { resolveModifier, beginTrack } from '../core/gesture.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function logSlider(el, opts = {}) {
  const o0 = { map: 'log', ...opts };
  const model = createModel(o0);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);

  el.classList.add('mp-track');
  if (o.variant) el.classList.add('mp-v-' + o.variant);
  // Readout ABOVE the rail so a finger/cursor on the thumb never hides it.
  el.innerHTML = `
    <div class="mp-track-row">
      <span class="mp-track-readout"></span>
      <input class="mp-track-input" type="text" inputmode="decimal" hidden />
    </div>
    <div class="mp-track-rail" tabindex="0">
      <div class="mp-track-fill"></div>
      <div class="mp-track-thumb"></div>
    </div>`;
  const rail = el.querySelector('.mp-track-rail');
  const fill = el.querySelector('.mp-track-fill');
  const thumb = el.querySelector('.mp-track-thumb');
  const readout = el.querySelector('.mp-track-readout');
  const input = el.querySelector('.mp-track-input');

  wireSlider(rail, { min: o.min, max: o.max, label: o.label });

  function render() {
    const v = model.get();
    const n = clamp(m.toNorm(v), 0, 1);
    fill.style.width = `${n * 100}%`;
    thumb.style.left = `${n * 100}%`;
    readout.textContent = model.format(v);
    updateAria(rail, { norm: n, text: model.format(v) });
  }
  model.on(render);

  function fromX(x) {
    const r = rail.getBoundingClientRect();
    const n = clamp((x - r.left) / r.width, 0, 1);
    model.apply(m.toValue(n));
  }
  const unbind = beginTrack(rail, {
    onDown: ({ x }) => fromX(x),
    onMove: ({ x }) => fromX(x),
    onUp: () => model.commit(),
  });

  // literal entry on readout click
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
  rail.addEventListener('dblclick', () => model.reset());

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else {
      // step in *norm* space for log so steps feel even across the decade
      const mod = resolveModifier(e);
      const dir = d > 0 ? 1 : -1;
      const n = clamp(m.toNorm(model.get()) + dir * 0.02 * mod, 0, 1);
      model.apply(m.toValue(n));
    }
    model.commit();
  }
  rail.addEventListener('keydown', onKey);

  render();
  return makeHandle(el, model, () => {
    unbind();
    rail.removeEventListener('keydown', onKey);
    el.classList.remove('mp-track');
  });
}

export default logSlider;
