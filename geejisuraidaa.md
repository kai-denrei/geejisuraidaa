# MANIPULANDA — manipulable gauges & sliders

> Working codename: **manipulanda** (HCI term: a *manipulandum* is a thing-to-be-manipulated). Placeholder; rename freely.

A local exploration project surveying the design space of value-editing controls — not "sliders" as one widget, but the full family of acquisition metaphors. The goal is a gallery of interchangeable, well-built controls plus a shared contract that lets any of them drive the same parameter.

This file is the handover brief. A Claude CLI session should be able to scaffold and build from it without re-deriving the prototypes — the interaction math is captured below.

---

## 1. The organizing frame

A "slider" is three orthogonal decisions stacked together. Most dissatisfaction with a control is one of these being wrong while the whole widget takes the blame. Every control in this project is described along these axes:

- **Acquisition** — how the value is grabbed. *Gestural* (drag / scrub / rotate), *positional* (tap-to-place, absolute), *discrete* (step), *literal* (type).
- **Mapping** — how the value's range projects onto the control's input. *Linear*, *log/exponential* (for ranges spanning orders of magnitude), *unipolar* vs *bipolar* (zero-centered), *bounded* vs *unbounded*.
- **Commit** — when the value updates downstream. *Live* (while dragging) vs *on-release*.

Relative vs absolute acquisition is the most consequential distinction in practice:
- **Relative** (knob, scrub field, encoder): precise, compact, unbounded in screen space, poor at-a-glance reading. Good for fine-tuning.
- **Absolute** (track slider, arc gauge, segmented meter): fast to set, doubles as a gauge, coarse to fine-tune. Good for "roughly where in range."

---

## 2. Control taxonomy (nomenclature)

Canonical names so the gallery is labeled consistently.

| Control | Acquisition | Notes |
|---|---|---|
| Track slider | positional | thumb = *handle*, colored portion = *fill*. Baseline. |
| Range slider | positional | two handles, min/max band |
| Stepped / notched slider | positional, discrete | track with detents |
| Bipolar slider | positional | zero-centered, *detent* at middle |
| Scrubbable number / drag-input | gestural (relative) | the value *is* the control; drag, click-to-type, dbl-click reset |
| Stepper / spinner / spin-button | discrete | `− [value] +`; precise, bad over wide ranges |
| Rotary knob / dial | gestural (relative) | vertical-drag (not circular). Dense panels. |
| Endless encoder | gestural (relative, unbounded) | jog wheel, no endpoints; nudge-from-anywhere |
| Arc / radial gauge | positional (absolute) | tap the arc; sweep doubles as a readable gauge |
| XY pad / 2D control | gestural | two correlated values at once (position, vector, pan/tilt) |
| Sliding ruler / scale picker | gestural (relative) | fixed needle, the *scale* translates underneath (mobile height-picker) |
| Segmented meter / fill bar | positional | no handle; the fill edge is the value; maps to quantized params |
| Odometer / barrel | discrete + gestural | per-digit wheels; high-precision exact entry |
| Vertical fader | positional | console metaphor; same model as track slider, rotated |
| Curve / envelope editor | gestural | value is a *function* (over time/input); Bézier handles |

Prior art worth reading: **Tweakpane** (the modern standard — sliders, points/XY, monitors, folders, preset import/export; framework-free), **lil-gui** (dat.GUI successor, scrubby-number-first), **Leva** (React). Audio VSTs for knobs/encoders; After Effects / Blender / Figma for the scrub-field convention.

---

## 3. Cross-cutting conventions (every control honors these)

- **Pair gesture with direct entry.** Always expose a typeable readout. Never force a drag to hit an exact value.
- **Modifier granularity.** `shift` = coarse (×10 / faster), `alt` = fine (×0.1 / slower). Per-pixel step scales accordingly.
- **Double-click → reset to default.**
- **Non-linear taper** (a.k.a. *response curve* / *skew*) for wide-range params. Log-map anything spanning orders of magnitude.
- **Bipolar + detent** for signed values: deadband near zero snaps to 0.
- **Keyboard**: arrows step, `PageUp/Down` big step, when focused.
- **Units & precision** in the readout (°, %, px). Round everything displayed.
- **Accessibility**: native `<input type=range>` gives ARIA + keyboard free. Custom controls must add `role="slider"`, `aria-valuemin/max/now/text`, `tabindex`, and keyboard handlers. Treat this as definition-of-done, not polish.
- **Commit mode** is per-control config, not hardcoded.

---

## 4. Shared control contract

The backbone of the project. Every control is an ES module exporting a factory with the same signature, so any control is a drop-in for any parameter and the gallery can swap them live.

```js
// control(el, opts) -> handle
//
// opts = {
//   min, max,            // numeric bounds (ignored for unbounded encoders)
//   step,                // base granularity (per-pixel or per-tick)
//   value,               // initial
//   default: v,          // dbl-click target
//   map: 'lin'|'log'|'bipolar',   // range -> input mapping
//   commit: 'live'|'release',
//   detent: 0,           // deadband half-width for bipolar (value units)
//   format: (v) => string,        // readout formatting
//   onInput: (v) => {},  // live
//   onChange: (v) => {}, // committed
// }
//
// returns handle = {
//   get(): number,
//   set(v): void,        // programmatic, clamps + re-renders, no event
//   on(cb): void,        // subscribe
//   destroy(): void,     // remove listeners
//   el,                  // root node
// }
```

Suggested layering: a small `core/` of pure helpers (mapping, clamp, modifier-resolve, arc geometry, a11y wiring) that every control imports, so the controls themselves are thin view+gesture layers.

---

## 5. Prototyped patterns (status: working)

Eight built and verified in-chat. Port these first; the math is below so nothing needs rediscovery.

### Mapping/entry layer (track-based, but the point is the mapping)
- **Scrubbable number** — relative drag; `value += (x−x0) * step * modifier`. Distinguish click from drag with a ~3px threshold → click enters text-edit (swap span↔input), dbl-click resets. This is the highest-value upgrade to existing slider-heavy panels.
- **Log-mapped slider** — native range as integer position `0..S`; `value = min * (max/min)^(pos/S)`; inverse `pos = S * ln(v/min)/ln(max/min)`. Fixes wide-range params (iterations, scale) where linear crushes the useful band.
- **Bipolar slider w/ detent** — range `−A..A`; on input, `if (|v| < detent) v = 0`. Center tick is the affordance.
- **XY pad** — square region, pointer→`(x,y)` in `[0,1]²` (or remapped to `[−1,1]²`); dbl-click recenters.

### Non-track metaphors
Geometry helpers shared by knob + arc:
```js
const polar = (cx,cy,r,deg) => { const a = deg*Math.PI/180; return {x: cx+r*Math.cos(a), y: cy+r*Math.sin(a)}; };
const arc = (cx,cy,r,a0,a1) => { const p0=polar(cx,cy,r,a0), p1=polar(cx,cy,r,a1), lg=(a1-a0)>180?1:0;
  return `M${p0.x} ${p0.y} A${r} ${r} 0 ${lg} 1 ${p1.x} ${p1.y}`; };
```
- **Rotary knob** — 270° sweep, gap at bottom: `angle = 135 + v*270` (deg, y-down clockwise). Acquisition is *relative vertical drag*, NOT circular: `v = v0 + (y0 − y)/180 * modifier`. Sensitivity = full range over ~180px. Indicator = line from `polar(r=14)` to `polar(r=30)`; value-fill = `arc(135, angle)`.
- **Arc gauge** — 180° top arc (`180°→360°`), *absolute positional*: `ang = atan2(dy, dx)` in screen space relative to center; clamp lower half to the nearest end; `v = (ang−180)/180`. Tap-to-jump.
- **Sliding ruler** — fixed needle at center, scale strip translates: `translateX = center − v*PPU`; inverse `v = (center − tx)/PPU`. PPU≈8px, major ticks every 10, labeled. Drag is relative. Add momentum/flick later.
- **Segmented meter** — N segments, no handle; `level = ceil((x − left)/width * N)`, clamp `0..N`. Fill edge is the value. Maps cleanly to quantized params; visual cousin of dot-matrix displays.

---

## 6. Backlog (to build)

Ordered roughly by value/novelty. Each must satisfy §3 and §4.

1. **Endless encoder / jog wheel** — relative, *unbounded*. Drag/rotate accumulates delta with no endpoints; optional flick-momentum. The "nudge from wherever you are" control. (Distinct interaction model still missing from the gallery.)
2. **Odometer / barrel** — per-digit spin wheels for exact high-precision entry; combine with scrub.
3. **Curve / envelope editor** — value-as-function; add/drag Bézier points; the gateway to time-varying params.
4. **Range slider & stepped slider** — complete the track family.
5. **Vertical fader bank** — console layout; test dense multi-control ergonomics.
6. **Stepper / spinner** — trivial but needed for the contract's discrete case.
7. **Preset / snapshot + morph** — save states, interpolate between them (the SNAP/TOUR pattern). Cross-cuts all controls.

Stretch experiments worth the project's name:
- **Pressure/velocity-sensitive** scrub (pointer `pressure`, drag speed → granularity).
- **Touch-strip / ribbon** (absolute 1D, tap-position).
- **Gesture-mapped 2D→1D** (radial flick magnitude).
- **Comparative bench harness**: same param, every control side-by-side, log time-to-target + overshoot. Turns the gallery into an actual usability instrument.

---

## 7. Tech & conventions

- **Vanilla ES modules, no build step.** Plain `<script type="module">`, native imports. PWA-able later but not required for the gallery.
- One module per control under `controls/`, all conforming to §4. No framework. (A `leva`/`tweakpane` adapter could come later for comparison, not as a dependency.)
- **Live HTML gallery** (`index.html`) that instantiates every control against a shared dummy param and shows its readout + event log. This is the dev surface.
- Pointer Events throughout (`setPointerCapture`), `touch-action: none` on drag surfaces. No mouse/touch split.
- No external runtime deps for core controls.

### Proposed structure
```
manipulanda/
  index.html              # gallery: every control, live, side-by-side
  core/
    map.js                # lin / log / bipolar map + inverse
    gesture.js            # modifier resolve, drag threshold, pointer helpers
    geometry.js           # polar(), arc()
    a11y.js               # role=slider wiring, keyboard
    control.js            # base helper / contract glue
  controls/
    scrub.js  knob.js  arc.js  ruler.js  meter.js
    log-slider.js  bipolar.js  xypad.js
    encoder.js  odometer.js  curve.js  ...   # backlog
  bench/
    harness.js            # time-to-target usability test (stretch)
  README.md
```

### Design system (dark editorial)
- Near-black canvas; flat surfaces, no gradients/shadows/glow.
- Type: **EB Garamond / Cormorant Garamond** for editorial text, **JetBrains Mono** for labels, readouts, numerics.
- Accents: **amber** (primary/active) + **teal** (secondary), restrained. Color encodes state, never decorates.
- **OKLCH** color space for all tokens.
- Tabular-nums on every numeric readout. Sentence case. Laconic labels.

```css
:root{
  --bg:        oklch(0.16 0.005 60);
  --surface:   oklch(0.20 0.006 60);
  --line:      oklch(0.30 0.008 60);
  --text:      oklch(0.90 0.01 80);
  --muted:     oklch(0.65 0.01 80);
  --amber:     oklch(0.74 0.13 70);
  --teal:      oklch(0.72 0.10 175);
  --font-serif:"EB Garamond", Cormorant Garamond, serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

---

## 8. Definition of done (per control)

1. Conforms to the §4 contract (factory signature, handle API).
2. Honors all §3 conventions that apply (modifiers, dbl-click reset, keyboard, a11y, units).
3. Documented along the §1 axes (acquisition / mapping / commit) in its module header.
4. Appears in the gallery with a one-line "where it earns its place" note.
5. Works under both pointer and touch; no console errors on rapid drag.

---

## 9. Open questions for the agent

- Single shared `value` type, or allow controls to carry their own (scalar vs 2-vector vs function)? Suggest: contract handles scalars; XY/curve declare a `dims` field and widen `get/set` to arrays.
- Commit semantics for live canvases: debounce `onInput`, or trust consumers? Lean: emit raw, let the consumer throttle.
- A11y for the genuinely non-linear controls (arc, ruler): `aria-valuetext` with the formatted human value, `aria-valuenow` with the normalized 0–1? Decide and apply uniformly.
- Theming: hardcode the dark editorial tokens, or make controls theme-agnostic (consume CSS vars only)? Prefer the latter so the gallery can host a light comparison.
