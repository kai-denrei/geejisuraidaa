// controls/bipolar.js — bipolar slider with center detent
//
// AXES (spec §1)
//   Acquisition: positional (absolute) — drag/tap the track.
//   Mapping:     bipolar (zero-centered, range −A..A). Detent: |v|<detent → 0.
//   Commit:      per opts.commit.
//
// WHERE IT EARNS ITS PLACE: signed params (pan, balance, offset) where 0 is the
// meaningful home; the center tick + deadband make true-zero easy to hit.
//
// Conventions: shift/alt modifiers, dbl-click reset, keyboard, typeable readout
// (full-width digits), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { beginTrack } from '../core/gesture.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function bipolar(el, opts = {}) {
  const o0 = { map: 'bipolar', min: -1, max: 1, detent: 0.05, value: 0, ...opts };
  const model = createModel(o0);
  const o = model.opts;
  const m = mapper('bipolar', o.min, o.max);

  el.classList.add('mp-track', 'mp-bipolar');
  el.innerHTML = `
    <div class="mp-track-rail" tabindex="0">
      <div class="mp-track-center"></div>
      <div class="mp-track-fill mp-bi-fill"></div>
      <div class="mp-track-thumb"></div>
    </div>
    <div class="mp-track-row">
      <span class="mp-track-readout"></span>
      <input class="mp-track-input" type="text" inputmode="decimal" hidden />
    </div>`;
  const rail = el.querySelector('.mp-track-rail');
  const fill = el.querySelector('.mp-bi-fill');
  const thumb = el.querySelector('.mp-track-thumb');
  const readout = el.querySelector('.mp-track-readout');
  const input = el.querySelector('.mp-track-input');

  wireSlider(rail, { min: o.min, max: o.max, label: o.label });
  const zeroN = m.toNorm(0); // 0.5 for symmetric

  function render() {
    const v = model.get();
    const n = clamp(m.toNorm(v), 0, 1);
    thumb.style.left = `${n * 100}%`;
    // fill from center to thumb
    const a = Math.min(n, zeroN), b = Math.max(n, zeroN);
    fill.style.left = `${a * 100}%`;
    fill.style.width = `${(b - a) * 100}%`;
    el.classList.toggle('mp-detented', v === 0);
    readout.textContent = model.format(v);
    updateAria(rail, { norm: n, text: model.format(v) });
  }
  model.on(render);

  function fromX(x) {
    const r = rail.getBoundingClientRect();
    const n = clamp((x - r.left) / r.width, 0, 1);
    model.apply(m.toValue(n)); // detent applied in model.sanitize
  }
  const unbind = beginTrack(rail, {
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
  rail.addEventListener('dblclick', () => model.reset());

  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else model.apply(model.get() + d);
    model.commit();
  }
  rail.addEventListener('keydown', onKey);

  render();
  return makeHandle(el, model, () => {
    unbind();
    rail.removeEventListener('keydown', onKey);
    el.classList.remove('mp-track', 'mp-bipolar');
  });
}

export default bipolar;
