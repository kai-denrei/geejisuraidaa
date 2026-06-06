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

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions
- [x] Project name next to badge — RESOLVED 2026-06-06: ゲージスライダー / geejisuraidaa (Japanese-primary, romaji secondary). Doubles as the unicode showcase. Badge moves to TOP-LEFT per user.
- [ ] Landing "minimalist version" of each control — static thumbnail, or live-but-stripped instance? Live is truer to the comparative-bench goal. — owner: minikai — since: 2026-06-06

## Assumptions
- Controls consume CSS vars only (theme-agnostic), so the gallery could host a light comparison later (spec §9 lean). — status: untested — since: 2026-06-06

## Dependencies
Blocked by:
Feeds into: [[dev]]

## Session Log
2026-06-06 — Init.
