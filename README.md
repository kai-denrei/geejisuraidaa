# geejisuraidaa

A survey of value-editing controls — not "sliders" as one widget, but the full
family of acquisition metaphors, all conforming to one shared contract so any
control can drive any parameter.

Vanilla ES modules, no build step. Pointer Events throughout. Installable PWA,
works offline.

**Live:** https://kai-denrei.github.io/geejisuraidaa/

## Run it locally

No build, no install. Serve the directory with any static server:

```bash
python3 -m http.server 8080      # from the repo root
```

Then open <http://localhost:8080/>. The **bench** tab (default) binds all eight
controls to one value — drag any, they all move. Each control also has its own
tab with a full instance, an event log, a toggleable `± fine` stepper, two
export buttons, and per-control visual variations.

> Must be served over HTTP(S) — ES module imports do not work from `file://`.

## The eight controls

| id      | control          | acquisition                  | mapping            |
|---------|------------------|------------------------------|--------------------|
| scrub   | Scrubbable number| gestural · relative          | linear             |
| log     | Log slider       | positional · absolute        | log / exponential  |
| bipolar | Bipolar slider   | positional · absolute        | bipolar + detent   |
| xypad   | XY pad           | gestural · positional        | linear ×2 (vector) |
| knob    | Rotary knob      | gestural · relative (v-drag) | linear             |
| arc     | Arc gauge        | positional · absolute (tap)  | linear             |
| ruler   | Sliding ruler    | gestural · relative          | linear             |
| meter   | Segmented meter  | positional · absolute        | linear (quantized) |

### Per-tab variations

Each control tab includes live variants: knob *spectrum* (red→green) and
*intensity* (→white), log-slider rectangle thumb, meter gradation, bipolar
sign-color, arc spectrum, ruler triangle needle, xypad grid, scrub boxed.
Driven by a single `opts.variant` flag.

## The contract

```js
import { scrub } from './controls/scrub.js';
const handle = scrub(el, {
  min, max, step, value, default: v,
  map: 'lin'|'log'|'bipolar', commit: 'live'|'release',
  detent, unit, format, variant, onInput, onChange,
});
// handle => { get(), set(v), on(cb), destroy(), el, opts }
```

XY pad declares `dims: 2`; its `get()/set()` take and return `[x, y]`.

### Conventions every control honors
- readout sits **above** the control (a finger/cursor never hides the value)
- shift = coarse (×10), alt = fine (×0.1) modifiers
- double-click → reset to default
- keyboard: arrows step, PageUp/Down big step, Home/End to ends (when focused)
- secondary `− / +` fine-tune stepper (toggleable; shift = ×10)
- typeable readout; **full-width digits (０-９) and full-width minus/period are
  accepted** (normalized via `NFKC` before parse)
- units + precision, `tabular-nums`
- `role="slider"` + `aria-valuemin/max/now/text`

## Per-control export

- **Download parameters** → JSON of that instance's `opts` plus the live `value`.
- **Save snippet** → a single self-contained ES module (`<control>.snippet.js`)
  with its `core/` deps inlined, exporting the same factory. No sibling files
  needed; style the `.mp-*` classes yourself or copy from `styles.css`.

## PWA / mobile

Installable, offline-capable, no build:

- `manifest.webmanifest` — name, icons (192/512 + maskable), standalone display.
- `service-worker.js` — hand-written runtime caching (NetworkFirst navigations →
  `offline.html`; StaleWhileRevalidate assets; CacheFirst fonts). Gated update:
  a toast asks before reloading (no surprise refresh mid-session).
- `app/pwa.js` — registration, update toast, Android install prompt, iOS
  Add-to-Home-Screen hint.
- iOS `<head>` tags + 180×180 apple-touch icon; `theme-color`.
- Touch: horizontal-scroll tabs, reflowing grid, larger hit targets on coarse
  pointers.

All paths are relative, so it runs the same at the site root or under a
sub-path (GitHub Pages). The SW cache name is keyed to the cache-bust token, so
a token bump propagates as an update.

## Cache busting / version badge

A cache-bust token is fingerprinted onto every same-origin asset URL and shown
in the **top-left badge**: three shape tiles, the project name, and the 8-char
token (click to copy). Bump it after editing assets:

```bash
./scripts/bust.sh
```

Auto-bump on save (dev watcher):

```bash
bash /Users/minikai/.claude-kainode/skills/cache-busting/scripts/watch.sh
```

## Architecture

```
geejisuraidaa/
  index.html              # tabbed shell; bench tab is the default view
  styles.css              # dark-editorial design system (OKLCH)
  manifest.webmanifest    # PWA manifest
  service-worker.js       # runtime caching + offline fallback
  offline.html            # offline fallback page
  core/
    map.js                # lin/log/bipolar map + inverse, clamp, quantize, detent
    gesture.js            # modifier resolve, drag threshold, pointer/track binders
    geometry.js           # polar(), arc()
    a11y.js               # role=slider wiring, keyboard step
    control.js            # contract glue: model, handle, NFKC number parse
  controls/               # one module per control, thin view+gesture over core/
    scrub.js  log-slider.js  bipolar.js  xypad.js
    knob.js   arc.js          ruler.js    meter.js
  app/
    registry.js           # the 8 controls: factory + metadata + variants
    snippet.js            # self-contained-module export builder
    main.js               # tabbed shell + bound bench + stepper + export
    pwa.js                # service-worker registration + update/install UX
  public/
    cb-badge.js           # cache-bust visual badge (top-left)
    cb-shapes/            # shape favicon cells
    icons/                # PWA icons (192/512/maskable/apple-180)
  scripts/
    bust.sh               # bump the cache-bust token
    fingerprint-urls.py   # append ?v=<token> to same-origin asset URLs
```

## Versioning

Cache-busting handles asset *freshness* (token + badge). Real version *history*
is the git repo — commit/tag for rollback and diff.

## Backlog (post-V1)

Endless encoder, odometer/barrel, curve editor, range/stepped slider, fader
bank, stepper, preset morph, and the comparative bench harness (time-to-target).
