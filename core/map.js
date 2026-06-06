// core/map.js — range <-> input mapping (spec §1 "Mapping" axis, §5 math)
//
// Pure functions. Three mappings, each with forward (norm->value) and inverse
// (value->norm), where norm is a 0..1 position along the control's input.
//
//   lin      — linear:  value = min + n*(max-min)
//   log      — log/exponential: value = min*(max/min)^n   (min,max same sign, !=0)
//   bipolar  — zero-centered linear with optional detent deadband near 0
//
// All map functions are total over their documented domain; callers clamp.

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Quantize v to the nearest multiple of step, anchored at origin (default min).
export function quantize(v, step, origin = 0) {
  if (!step || step <= 0) return v;
  const n = Math.round((v - origin) / step);
  // Avoid binary float drift on the readout.
  return Number((origin + n * step).toFixed(10));
}

// ---- linear -------------------------------------------------------------
export const linToValue = (n, min, max) => min + n * (max - min);
export const linToNorm = (v, min, max) =>
  max === min ? 0 : (v - min) / (max - min);

// ---- logarithmic --------------------------------------------------------
// Requires min,max strictly positive (or both negative) and min !== max.
export function logToValue(n, min, max) {
  return min * Math.pow(max / min, n);
}
export function logToNorm(v, min, max) {
  return Math.log(v / min) / Math.log(max / min);
}

// ---- bipolar ------------------------------------------------------------
// Symmetric or asymmetric: norm 0..1 maps linearly across [min,max]; the
// detent snaps |value| < detent to 0 (deadband half-width in value units).
export const bipolarToValue = (n, min, max) => min + n * (max - min);
export const bipolarToNorm = (v, min, max) =>
  max === min ? 0 : (v - min) / (max - min);
export function applyDetent(v, detent) {
  return detent > 0 && Math.abs(v) < detent ? 0 : v;
}

// ---- dispatcher ---------------------------------------------------------
// map: 'lin' | 'log' | 'bipolar'. Returns {toValue(n), toNorm(v)}.
export function mapper(map, min, max) {
  switch (map) {
    case 'log':
      return {
        toValue: (n) => logToValue(n, min, max),
        toNorm: (v) => logToNorm(v, min, max),
      };
    case 'bipolar':
      return {
        toValue: (n) => bipolarToValue(n, min, max),
        toNorm: (v) => bipolarToNorm(v, min, max),
      };
    case 'lin':
    default:
      return {
        toValue: (n) => linToValue(n, min, max),
        toNorm: (v) => linToNorm(v, min, max),
      };
  }
}
