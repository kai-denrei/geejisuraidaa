---
project: geejisuraidaa
created: 2026-06-06
status: active
mode: solo
stale_threshold_days: 30
---

# geejisuraidaa (ゲージスライダー / manipulanda) — Index

## Brief
A local, build-step-free exploration of the design space of value-editing controls — not "sliders" as one widget but the full family of acquisition metaphors (track, scrub, knob, arc, ruler, meter, XY, log, bipolar, …). Every control is an ES module conforming to one shared contract (`control(el, opts) -> handle`) so any control is a drop-in for any parameter. V1 delivers a tabbed gallery (one control per tab) plus a landing page showing minimalist versions side-by-side, with per-control parameter download and standalone-snippet export, cache-busting + a visual version badge, and unicode/Japanese-aware labels and readouts.

## Active Roles
- [[dev]] — owner: minikai
- [[arch]] — owner: minikai
- [[pm]] — owner: minikai
- [[ux]] — owner: minikai
- [[qa]] — owner: minikai
- [[devops]] — owner: minikai

## Key Decisions
<!-- Cross-role summary, maintained by COMPACT -->
- 2026-06-06 — Vanilla ES modules, no build step; Pointer Events throughout. (source: [[arch]], from spec §7)
- 2026-06-06 — Tabbed shell (one control per tab) + minimalist side-by-side landing page. (source: [[ux]])

## Open Questions (cross-role)
- Tabs isolate controls, but the spec's headline value (§138 comparative bench) is side-by-side comparison. Does the tab-first layout undercut the project's reason to exist? Tracked in [[pm]] and [[ux]].
- "Standalone snippet" portability vs the deliberate `core/` factoring — snippet export must inline shared deps. Tracked in [[arch]] and [[dev]].
