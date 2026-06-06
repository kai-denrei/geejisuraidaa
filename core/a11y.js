// core/a11y.js — role=slider wiring + keyboard (spec §3 accessibility)
//
// Resolves spec §9: aria-valuenow carries the normalized 0..1 (uniform across
// linear and non-linear controls), aria-valuetext carries the formatted human
// value with units. Keyboard: arrows step, PageUp/Down big step, Home/End ends.
//
//   wireSlider(el, { min:0, max:1 })  -> set role/tabindex/aria scaffolding
//   updateAria(el, { norm, text })    -> refresh valuenow/valuetext
//   keyStep(ev, { step, page })       -> delta in *value units*, or null
//
// step/page are in value units; modifiers (§3) scale them: shift ×10, alt ×0.1.

import { resolveModifier } from './gesture.js';

export function wireSlider(el, { min = 0, max = 1, label } = {}) {
  el.setAttribute('role', 'slider');
  el.setAttribute('aria-valuemin', String(min));
  el.setAttribute('aria-valuemax', String(max));
  if (label) el.setAttribute('aria-label', label);
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
}

export function updateAria(el, { norm, text }) {
  if (norm != null) el.setAttribute('aria-valuenow', norm.toFixed(4));
  if (text != null) el.setAttribute('aria-valuetext', text);
}

// Returns a value-unit delta for a key press, or null if the key is not a
// stepping key (so the caller can ignore / not preventDefault).
export function keyStep(ev, { step = 1, page = null } = {}) {
  const m = resolveModifier(ev);
  const big = page != null ? page : step * 10;
  switch (ev.key) {
    case 'ArrowUp':
    case 'ArrowRight':
      return +step * m;
    case 'ArrowDown':
    case 'ArrowLeft':
      return -step * m;
    case 'PageUp':
      return +big * m;
    case 'PageDown':
      return -big * m;
    case 'Home':
      return 'min';
    case 'End':
      return 'max';
    default:
      return null;
  }
}
