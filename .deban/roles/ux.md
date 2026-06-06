---
role: ux
owner: minikai
status: active
last-updated: 2026-06-06
---

# UX — Interaction & Visual

## Scope
Owns the tabbed shell, the minimalist side-by-side landing page, the dark-editorial design system (spec §7), and the cache-busting version badge (3-shape favicon + corner widget, small fonts next to project name, top-left).

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-06-06 | Dark editorial tokens (OKLCH), EB Garamond + JetBrains Mono, amber/teal accents, tabular-nums | Spec §7 design system, given verbatim. | [[dev]] |
| 2026-06-06 | Version badge top-left: 3 shapes + project name + small version font, from cache-busting skill | User requirement. | [[devops]] |
| 2026-06-06 | Landing = default first tab in single index.html (no separate landing.html) | Keeps badge+meta on the one entry the owner opens; brief permitted this option. | [[devops]] |
| 2026-06-06 | Landing hosts LIVE stripped instances of all 8 side-by-side, not thumbnails | Preserves the spec §138 comparative value the tab layout otherwise isolates. | [[pm]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|
| 2026-06-06 | Landing `.cell-mount` as `display:flex; align-items:center` to vertically center the minimalist controls | Collapsed the width-dependent controls (track rail, ruler view, xy field): their children are all absolutely-positioned, so in-flow content width = 0, and a flex item shrinks to it → 0-width, invisible. Meter survived only because segment borders gave ~57px max-content. Fix: block mount + text-align (matches the per-tab `.mount`, which is block and worked). |

## Lessons
- A control whose visible parts are all `position:absolute` contributes zero in-flow size; never mount it as a bare flex item (it shrinks to nothing). Give such mounts block layout or an explicit width. — from dead end on 2026-06-06

## Open Questions
- [x] Project name next to badge — RESOLVED 2026-06-06: ゲージスライダー / geejisuraidaa (Japanese-primary, romaji secondary). Doubles as the unicode showcase. Badge moves to TOP-LEFT per user.
- [x] Landing "minimalist version" — RESOLVED 2026-06-06: live-but-stripped instances (readout rows hidden), truer to the comparative-bench goal. Required the block-mount fix above to render the width-dependent ones.

## Assumptions
- Controls consume CSS vars only (theme-agnostic), so the gallery could host a light comparison later (spec §9 lean). — status: untested — since: 2026-06-06

## Dependencies
Blocked by:
Feeds into: [[dev]]

## Session Log
2026-06-06 — Fixed landing bench: ruler/log-slider/bipolar/xypad were collapsing to 0 width in the flex cell-mount; switched mount to block. Recorded as dead end + lesson.
2026-06-06 — Tabbed shell + live comparative landing built; badge repositioned top-left with ゲージスライダー name. Dark-editorial §7 tokens applied verbatim.
2026-06-06 — Init.
