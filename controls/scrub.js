// controls/scrub.js — scrubbable number / drag-input
//
// AXES (spec §1)
//   Acquisition: gestural, relative — drag horizontally to nudge; the value IS
//                the control. Click (sub-threshold) enters literal text-edit.
//   Mapping:     linear; per-pixel = range/~320px so a bounded param sweeps
//                min→max in a comfortable drag (step stays the precision floor).
//   Commit:      per opts.commit ('live' default | 'release').
//
// WHERE IT EARNS ITS PLACE: the highest-value upgrade to slider-heavy panels —
// compact, unbounded in screen space, precise; click-to-type for exact entry.
// 値そのものが操作子。ドラッグで微調整、クリックで直接入力。
//
// Conventions (§3): shift=coarse/alt=fine modifiers, dbl-click reset, keyboard
// arrows/Page, typeable readout (full-width digits parsed), units, role=slider.

import { createModel, makeHandle, parseNumberLoose } from '../core/control.js';
import { resolveModifier, beginDrag, DRAG_THRESHOLD } from '../core/gesture.js';
import { mapper } from '../core/map.js';
import { wireSlider, updateAria, keyStep } from '../core/a11y.js';

export function scrub(el, opts = {}) {
  const model = createModel(opts);
  const o = model.opts;
  const m = mapper(o.map, o.min, o.max);

  // Per-pixel travel. The spec's literal form is dx*step, but for a bounded
  // param that makes a full min→max sweep cost range/step px (here 100/0.1 =
  // 1000px) — far too wide. Base per-pixel on the range so a full sweep takes
  // ~FULL_PX px; keep step as the precision floor and quantization granularity
  // (the model quantizes to step in sanitize). Unbounded → fall back to step.
  const FULL_PX = o.sweepPx || 320;
  const range = o.max - o.min;
  const perPx = (o.bounded !== false && Number.isFinite(range) && range > 0)
    ? Math.max(o.step, range / FULL_PX)
    : o.step;

  el.classList.add('mp-scrub');
  el.innerHTML = `<span class="mp-scrub-readout" tabindex="0"></span><input class="mp-scrub-input" type="text" inputmode="decimal" hidden />`;
  const readout = el.querySelector('.mp-scrub-readout');
  const input = el.querySelector('.mp-scrub-input');

  wireSlider(readout, { min: o.min, max: o.max, label: o.label });

  function render() {
    const v = model.get();
    readout.textContent = model.format(v);
    updateAria(readout, { norm: m.toNorm(v), text: model.format(v) });
  }
  model.on(render);
  render();

  // ---- drag (relative) --------------------------------------------------
  let startVal = 0;
  const unbindDrag = beginDrag(readout, {
    onStart: () => {
      startVal = model.get();
    },
    onMove: ({ dx, ev, moved }) => {
      if (!moved) return;
      const mod = resolveModifier(ev);
      model.apply(startVal + dx * perPx * mod);
    },
    onEnd: ({ moved }) => {
      if (moved) model.commit();
      else enterEdit(); // sub-threshold = click = type
    },
  });

  // ---- literal entry ----------------------------------------------------
  function enterEdit() {
    input.value = model.format(model.get()).replace(o.unit || '', '');
    readout.hidden = true;
    input.hidden = false;
    input.focus();
    input.select();
  }
  function commitEdit(keep) {
    if (keep) {
      const v = parseNumberLoose(input.value);
      if (Number.isFinite(v)) {
        model.apply(v);
        model.commit();
      }
    }
    input.hidden = true;
    readout.hidden = false;
  }
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commitEdit(true);
    else if (e.key === 'Escape') commitEdit(false);
  });
  input.addEventListener('blur', () => commitEdit(true));

  // dbl-click reset (§3)
  readout.addEventListener('dblclick', () => model.reset());

  // ---- keyboard (§3) ----------------------------------------------------
  function onKey(e) {
    const d = keyStep(e, { step: o.step });
    if (d == null) return;
    e.preventDefault();
    if (d === 'min') model.apply(o.min);
    else if (d === 'max') model.apply(o.max);
    else model.apply(model.get() + d);
    model.commit();
  }
  readout.addEventListener('keydown', onKey);

  return makeHandle(el, model, () => {
    unbindDrag();
    readout.removeEventListener('keydown', onKey);
    el.classList.remove('mp-scrub');
  });
}

export default scrub;
