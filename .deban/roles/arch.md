---
role: arch
owner: minikai
status: active
last-updated: 2026-06-06
---

# Architecture

## Scope
Owns the shared control contract, the `core/` helper layer, module boundaries, and the snippet-export mechanism.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-06-06 | Vanilla ES modules, no build step; native imports; Pointer Events + setPointerCapture; touch-action:none on drag surfaces | Spec §7. Keeps the gallery the dev surface, no toolchain. | [[dev]] [[devops]] |
| 2026-06-06 | `core/` = map.js, gesture.js, geometry.js, a11y.js, control.js; controls are thin view+gesture layers importing core | Spec §4 layering note. | [[dev]] |
| 2026-06-06 | Snippet export inlines required core deps into one artifact (control is not portable otherwise) | Resolves the §4-vs-portability tension. | [[dev]] [[pm]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions
- [x] Snippet artifact form — RESOLVED 2026-06-06: user chose a single ES module `.js` with required core deps inlined (so it imports cleanly into other code projects).
- [ ] Shared `value` type — scalar vs 2-vector (XY) vs function (curve). Spec §9 suggests `dims` field widening get/set to arrays. — owner: minikai — since: 2026-06-06

## Assumptions
- A tiny build-free "inline core" step (string-concat of named core modules) is enough for snippet export; no bundler. — status: untested — since: 2026-06-06

## Dependencies
Blocked by:
Feeds into: [[dev]]

## Session Log
2026-06-06 — Init. Locked no-build ES-module architecture and core/ layering from spec.
