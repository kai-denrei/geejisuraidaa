---
role: dev
owner: minikai
status: active
last-updated: 2026-06-06
---

# Dev — Implementation

## Scope
Implements `core/` helpers and the per-control modules to the §4 contract, the tabbed shell, the landing page, and the download/snippet buttons.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-06-06 | Port the 8 prototyped controls first; math copied verbatim from spec §5 | No rediscovery; spec captured the interaction math. | [[arch]] [[pm]] |
| 2026-06-06 | Parameter download = JSON of `opts` + the live current value (not defaults-only) | A shared param should round-trip the actual state, not just config. | [[arch]] |
| 2026-06-06 | xypad keeps `control()` contract via `dims:2`; get/set take `[x,y]` | Spec §9 lean — scalar contract, vectors declare `dims` and widen get/set. | [[arch]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions
- [ ] Parameter download format: JSON of `opts` per control instance. Confirm shape (include current value? defaults only?). — owner: minikai — since: 2026-06-06

## Assumptions
- Each control honors §3 conventions (modifiers, dbl-click reset, keyboard, a11y, units) as definition-of-done, not polish. — status: untested — since: 2026-06-06

## Dependencies
Blocked by: [[arch]] core helpers
Feeds into: [[qa]]

## Session Log
2026-06-06 — Built core/ + all 8 controls to §4 contract, full-width-digit NFKC entry, both export buttons per control. All pass node --check.
2026-06-06 — Init.
