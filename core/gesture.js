// core/gesture.js — pointer gesture helpers (spec §3 modifiers, §5 thresholds)
//
// Pure-ish helpers: modifier resolution, drag threshold, and a thin pointer-
// drag binder built on Pointer Events + setPointerCapture (spec §7).
//
//   resolveModifier(ev)  -> multiplier: shift = coarse (×10), alt = fine (×0.1)
//   DRAG_THRESHOLD       -> px to distinguish a click from a drag (§5 ~3px)
//   beginDrag(...)       -> wires pointerdown/move/up with capture, calls back
//                           with cumulative dx,dy and the originating event.

export const DRAG_THRESHOLD = 3;

// shift = coarse (×10 / faster); alt = fine (×0.1 / slower); both => 1.
export function resolveModifier(ev) {
  const coarse = ev.shiftKey;
  const fine = ev.altKey;
  if (coarse && fine) return 1;
  if (coarse) return 10;
  if (fine) return 0.1;
  return 1;
}

// Bind a relative-drag gesture to an element.
// opts: { onStart(ev), onMove({dx,dy,x,y,ev,moved}), onEnd({moved,ev}) }
// Distinguishes click vs drag via DRAG_THRESHOLD; reports `moved` once crossed.
export function beginDrag(el, opts = {}) {
  const { onStart, onMove, onEnd } = opts;

  function down(ev) {
    // Primary button / touch / pen only.
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    const x0 = ev.clientX;
    const y0 = ev.clientY;
    let moved = false;
    try {
      el.setPointerCapture(ev.pointerId);
    } catch (_) {
      /* capture may be unavailable in odd contexts; degrade gracefully */
    }
    if (onStart) onStart(ev);

    function move(mv) {
      const dx = mv.clientX - x0;
      const dy = mv.clientY - y0;
      if (!moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) moved = true;
      if (onMove) onMove({ dx, dy, x: mv.clientX, y: mv.clientY, ev: mv, moved });
    }
    function up(uv) {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch (_) {
        /* no-op */
      }
      if (onEnd) onEnd({ moved, ev: uv });
    }
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  el.addEventListener('pointerdown', down);
  // Return an unbinder for destroy().
  return () => el.removeEventListener('pointerdown', down);
}

// Absolute pointer position binder (tap-to-place / arc / xypad).
// opts: { onDown({x,y,ev}), onMove({x,y,ev}), onUp({ev}) }
export function beginTrack(el, opts = {}) {
  const { onDown, onMove, onUp } = opts;
  function down(ev) {
    if (ev.button != null && ev.button !== 0) return;
    ev.preventDefault();
    try {
      el.setPointerCapture(ev.pointerId);
    } catch (_) {}
    if (onDown) onDown({ x: ev.clientX, y: ev.clientY, ev });
    function move(mv) {
      if (onMove) onMove({ x: mv.clientX, y: mv.clientY, ev: mv });
    }
    function up(uv) {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      try {
        el.releasePointerCapture(ev.pointerId);
      } catch (_) {}
      if (onUp) onUp({ ev: uv });
    }
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }
  el.addEventListener('pointerdown', down);
  return () => el.removeEventListener('pointerdown', down);
}
