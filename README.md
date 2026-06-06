# ゲージスライダー / geejisuraidaa

**manipulanda** — a survey of value-editing controls. Not "sliders" as one
widget, but the full family of acquisition metaphors, all conforming to one
shared contract so any control can drive any parameter.

Vanilla ES modules, no build step. Pointer Events throughout.

## Run it

No build, no install. Serve the directory with any static server:

```bash
python3 -m http.server 8080 --directory /Users/minikai/Dev/geejisuraidaa
```

Then open <http://localhost:8080/>. The **landing tab** ("landing / 一覧") is the
comparison bench: all eight controls live, side-by-side, stripped down. Each
control also has its own tab with a full-size instance, an event log, and two
export buttons.

> Must be served over HTTP (ES module imports do not work from `file://`).

## The eight controls (V1)

| id      | control            | acquisition                    | mapping            |
|---------|--------------------|--------------------------------|--------------------|
| scrub   | Scrubbable number  | gestural · relative            | linear             |
| log     | Log-mapped slider  | positional · absolute          | log / exponential  |
| bipolar | Bipolar slider     | positional · absolute          | bipolar + detent   |
| xypad   | XY pad             | gestural · positional          | linear ×2 (vector) |
| knob    | Rotary knob        | gestural · relative (v-drag)   | linear             |
| arc     | Arc gauge          | positional · absolute (tap)    | linear             |
| ruler   | Sliding ruler      | gestural · relative            | linear             |
| meter   | Segmented meter    | positional · absolute          | linear (quantized) |

## The contract (spec §4)

```js
import { scrub } from './controls/scrub.js';
const handle = scrub(el, {
  min, max, step, value, default: v,
  map: 'lin'|'log'|'bipolar', commit: 'live'|'release',
  detent, unit, format, onInput, onChange,
});
// handle => { get(), set(v), on(cb), destroy(), el, opts }
```

XY pad declares `dims: 2`; its `get()/set()` take and return `[x, y]`.

### Conventions every control honors (spec §3)
- shift = coarse (×10), alt = fine (×0.1) modifiers
- double-click → reset to default
- keyboard: arrows step, PageUp/Down big step, Home/End to ends (when focused)
- typeable readout paired with the gesture; **full-width digits (０-９) and
  full-width minus/period are accepted** (normalized via `NFKC` before parse)
- units + precision in the readout, `tabular-nums`
- `role="slider"` + `aria-valuemin/max/now/text` (`valuenow` = normalized 0–1,
  `valuetext` = formatted human value)

## Per-control export buttons

On each control's tab:

- **Download parameters** → a JSON file of that instance's `opts` plus the
  current live `value`.
- **Save snippet** → a single self-contained ES module (`<control>.snippet.js`)
  with its `core/` dependencies inlined, exporting the same factory. Drop it
  into any project; it needs no sibling files (style the `.mp-*` classes yourself
  or copy from `styles.css`).

## Architecture

```
geejisuraidaa/
  index.html              # tabbed shell; landing tab is the default view
  styles.css              # dark-editorial design system (OKLCH, spec §7)
  core/
    map.js                # lin / log / bipolar map + inverse, clamp, quantize, detent
    gesture.js            # modifier resolve, drag threshold, pointer/track binders
    geometry.js           # polar(), arc()
    a11y.js               # role=slider wiring, keyboard step
    control.js            # contract glue: model, handle, NFKC number parse
  controls/               # one module per control, thin view+gesture over core/
    scrub.js  log-slider.js  bipolar.js  xypad.js
    knob.js   arc.js          ruler.js    meter.js
  app/
    registry.js           # the 8 controls: factory + metadata + demo opts
    snippet.js            # self-contained-module export builder
    main.js               # tabbed shell + landing + export wiring
  public/
    cb-badge.js           # cache-bust visual badge (top-left, project name + token)
    cb-shapes/            # shape favicon cells
  scripts/
    bust.sh               # bump the cache-bust token
    fingerprint-urls.py   # append ?v=<token> to same-origin asset URLs
```

## Cache busting / version badge

A cache-bust token is fingerprinted onto every same-origin asset URL and shown
in the **top-left badge**: three shape tiles, then the project name
`ゲージスライダー geejisuraidaa`, then the 8-char token (small, muted). Click the
badge to copy the token. The project name is read from
`<meta name="app-name">`.

**Bump the token** (run after editing assets):

```bash
./scripts/bust.sh
```

**Auto-bump on save** (dev watcher):

```bash
bash /Users/minikai/.claude-kainode/skills/cache-busting/scripts/watch.sh
```

Current token lives in `<meta name="cb">` in `index.html`.

## Versioning

Cache-busting handles asset *freshness* (token + badge). Real version *history*
is the git repo (Kai Denrei identity) — commit/tag for rollback and diff.

## Backlog (post-V1, spec §6)

Endless encoder, odometer/barrel, curve editor, range/stepped slider, fader
bank, stepper, preset morph, and the comparative bench harness (time-to-target).
