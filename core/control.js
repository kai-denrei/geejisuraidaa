// core/control.js — shared contract glue (spec §4 factory/handle, §3 conventions)
//
// Every control composes a Model + the handle API here, then layers its own
// view/gesture on top. The Model owns: value store, clamp + quantize + detent,
// commit semantics (live vs release), subscriber fan-out, default formatting,
// and unicode-aware (full-width digit) parse of typed entry.
//
// Axes (spec §1) are documented per control; this glue is mapping/commit
// agnostic — it takes the resolved value and notifies.

import { clamp, quantize, applyDetent } from './map.js';

// Normalize full-width digits ０-９, full-width minus/period/plus, etc. to ASCII
// before parseFloat (spec requirement 7). NFKC folds the full-width forms.
export function parseNumberLoose(raw) {
  if (raw == null) return NaN;
  const s = String(raw).normalize('NFKC').replace(/[,\s]/g, '').trim();
  if (s === '') return NaN;
  return parseFloat(s);
}

// Default readout formatter: precision derived from step, tabular-friendly.
export function makeFormat({ step = 1, unit = '' } = {}) {
  let dp = 0;
  if (step > 0 && step < 1) {
    // decimals needed to represent the step
    const str = step.toString();
    dp = str.includes('.') ? str.split('.')[1].length : 0;
    dp = Math.min(dp, 6);
  }
  return (v) => {
    const n = Number.isFinite(v) ? v.toFixed(dp) : '—';
    return unit ? `${n}${unit}` : n;
  };
}

// Build the shared model. opts mirrors spec §4.
export function createModel(opts) {
  const o = {
    min: 0,
    max: 1,
    step: 0.01,
    value: 0,
    default: undefined,
    map: 'lin',
    commit: 'live',
    detent: 0,
    unit: '',
    bounded: true,
    ...opts,
  };
  if (o.default === undefined) o.default = o.value;
  const format = o.format || makeFormat({ step: o.step, unit: o.unit });

  const subs = new Set();
  let value = sanitize(o.value);

  function sanitize(v) {
    if (!Number.isFinite(v)) v = o.min;
    if (o.detent) v = applyDetent(v, o.detent);
    if (o.step) v = quantize(v, o.step, o.min);
    if (o.bounded) v = clamp(v, o.min, o.max);
    // detent again post-quantize so 0 survives snapping
    if (o.detent) v = applyDetent(v, o.detent);
    return v;
  }

  // emit: 'input' (live) or 'change' (committed). Always notifies subscribers.
  function emit(kind) {
    for (const cb of subs) cb(value, kind);
    if (kind === 'input' && o.onInput) o.onInput(value);
    if (kind === 'change' && o.onChange) o.onChange(value);
  }

  return {
    opts: o,
    format,
    get: () => value,
    // internal setter used by gesture layers; honors commit mode
    apply(v, { live = true } = {}) {
      const next = sanitize(v);
      const changed = next !== value;
      value = next;
      if (o.commit === 'live') {
        if (changed || live) emit('input');
      } else {
        // release mode: still emit input for subscribers (readout/log) but
        // reserve 'change' for commit()
        if (changed) emit('input');
      }
      return value;
    },
    // commit boundary (pointerup): fire 'change'
    commit() {
      emit('change');
      return value;
    },
    // public programmatic set: clamps + notifies subscribers, no onInput/onChange
    set(v) {
      value = sanitize(v);
      for (const cb of subs) cb(value, 'set');
      return value;
    },
    reset() {
      value = sanitize(o.default);
      emit('change');
      for (const cb of subs) cb(value, 'set');
      return value;
    },
    on(cb) {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    clearSubs() {
      subs.clear();
    },
  };
}

// Assemble the public handle (spec §4) from a model + root el + destroy hook.
export function makeHandle(el, model, destroyFn) {
  return {
    el,
    get: model.get,
    set: model.set,
    on: model.on,
    destroy() {
      model.clearSubs();
      if (destroyFn) destroyFn();
    },
    // expose opts for the "Download parameters" export (spec requirement 6)
    opts: model.opts,
  };
}
