// controls/knob.js — rotary knob / dial (vertical-drag acquisition)
//
// AXES (spec §1)
//   Acquisition: gestural, RELATIVE vertical drag (NOT circular). Sensitivity =
//                full range over SENS_PX (≈ the knob's own height): so a drag
//                from just below the arc to its apex sweeps min→max without an
//                over-long reach. v = v0 + (y0 − y)/SENS_PX * range * modifier.
//   Mapping:     linear (per opts.map; lin default).
//   Commit:      per opts.commit.
//
// Visual: 270° sweep, gap at bottom. angle = 135 + n*270 (deg, y-down CW).
// Indicator = line polar(r=14)→polar(r=30); value-fill = arc(135, angle). (§5)
//
// WHERE IT EARNS ITS PLACE: dense panels — compact, precise fine-tuning where a
// track would not fit. Vertical drag avoids the circular-acquisition footguns.
// 高密度パネル向け。縦ドラッグで精密調整、円形操作の罠を回避。
//
// Conventions: shift/alt modifiers, dbl-click reset, keyboard, typeable readout
// (full-width digits), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { mapper, clamp } from '../core/map.js';
import { resolveModifier, beginDrag } from '../core/gesture.js';
import { polar, arc } from '../core/geometry.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function knob(el, opts = {}) {
  const model = createModel(opts);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);
  const range = o.max - o.min;
  // Vertical px for a full min→max sweep. Tightened from the spec's ~180px to
  // ~100px (≈ the rendered knob height) so the apex is reachable in one short
  // drag; alt = fine modifier still gives precision. Tune to taste.
  const SENS_PX = o.sensitivityPx || 100;

  const cx = 32, cy = 32, R = 26;
  el.classList.add('mp-knob');
  el.innerHTML = `
    <svg viewBox="0 0 64 64" class="mp-knob-svg" tabindex="0">
      <path class="mp-knob-bg" d="${arc(cx, cy, R, 135, 405)}" fill="none"/>
      <path class="mp-knob-fill" fill="none"/>
      <line class="mp-knob-ind"/>
      <circle class="mp-knob-hub" cx="${cx}" cy="${cy}" r="6"/>
    </svg>
    <div class="mp-knob-row">
      <span class="mp-knob-readout"></span>
      <input class="mp-knob-input" type="text" inputmode="decimal" hidden/>
    </div>`;
  const svg = el.querySelector('.mp-knob-svg');
  const fillP = el.querySelector('.mp-knob-fill');
  const ind = el.querySelector('.mp-knob-ind');
  const readout = el.querySelector('.mp-knob-readout');
  const input = el.querySelector('.mp-knob-input');

  wireSlider(svg, { min: o.min, max: o.max, label: o.label });

  function render() {
    const v = model.get();
    const n = clamp(m.toNorm(v), 0, 1);
    const angle = 135 + n * 270;
    fillP.setAttribute('d', n > 0.001 ? arc(cx, cy, R, 135, angle) : '');
    const a = polar(cx, cy, 14, angle);
    const b = polar(cx, cy, 30, angle);
    ind.setAttribute('x1', a.x); ind.setAttribute('y1', a.y);
    ind.setAttribute('x2', b.x); ind.setAttribute('y2', b.y);
    readout.textContent = model.format(v);
    updateAria(svg, { norm: n, text: model.format(v) });
  }
  model.on(render);

  let startVal = 0;
  const unbind = beginDrag(svg, {
    onStart: () => { startVal = model.get(); },
    onMove: ({ dy, ev, moved }) => {
      if (!moved) return;
      const mod = resolveModifier(ev);
      // up = increase. dy = y − y0, so use −dy. Full range over SENS_PX px.
      model.apply(startVal + (-dy / SENS_PX) * range * mod);
    },
    onEnd: ({ moved }) => {
      if (moved) model.commit(); else enterEdit();
    },
  });

  function enterEdit() {
    input.value = model.format(model.get()).replace(o.unit || '', '');
    readout.hidden = true; input.hidden = false; input.focus(); input.select();
  }
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
    el.classList.remove('mp-knob');
  });
}

export default knob;
