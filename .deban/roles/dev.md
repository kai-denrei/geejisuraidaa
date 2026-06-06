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
2026-06-06 — Init.
