---
role: pm
owner: minikai
status: active
last-updated: 2026-06-06
---

# PM — Product / Scope

## Scope
Owns V1 scope definition, sequencing, and the working-localhost goal. Drives the build to a reviewable V1 and guards against scope drift across the control backlog.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-06-06 | V1 = tabbed shell + landing page + parameter-download + snippet-export, over the 8 already-prototyped controls | Spec §5 lists these as built & verified; math is captured so no rediscovery. Backlog (§6) is post-V1. | [[dev]] [[arch]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons
<!-- Distilled principles from Dead Ends. -->

## Open Questions
<!-- Untested assumptions in the brief, surfaced at init per /deban init step 5 -->
- [ ] Tab-per-control isolates each widget, but the spec's stated headline value (§138 "comparative bench harness — same param, every control side-by-side") is *comparison*. Does tab-first layout undercut the project's reason to exist, leaving the landing page to carry all the comparative load? — owner: minikai — since: 2026-06-06
- [ ] "Save the code as a standalone snippet to share with other projects" assumes per-control portability, but the architecture (§4, §7) deliberately factors shared logic into `core/` (map, gesture, geometry, a11y). A real standalone snippet must inline those deps — non-trivial, needs a defined export format. — owner: minikai — since: 2026-06-06
- [x] "Working V1 according to specs" — RESOLVED 2026-06-06: user confirmed V1 = all 8 prototyped controls (scrub, log-slider, bipolar, xypad, knob, arc, ruler, meter). Backlog (§6) deferred.
- [ ] "Cache-busting for cache-management AND versioning control" conflates two things: cache-busting gives asset-freshness + a version *token/badge*, not semantic version *history* (no rollback, no diff). If the user means real version control, a git repo with tags is the actual mechanism. — owner: minikai — since: 2026-06-06
- [ ] "Support unicode/Japanese wherever possible" — these are *numeric* editors; unicode mostly lands on labels, units, project chrome, and full-width-digit handling in type-to-enter fields, not the acquisition math. Scope of the requirement may be narrower than it reads. — owner: minikai — since: 2026-06-06

## Assumptions
- V1 target is a single-machine localhost served by a static file server (no backend). — status: untested — since: 2026-06-06
- The 8 prototyped controls constitute V1; backlog deferred. — status: validated — since: 2026-06-06

## Dependencies
Blocked by: build-shaping answers (scope, snippet format, versioning, name).
Feeds into: [[dev]] [[arch]] [[ux]]

## Session Log
2026-06-06 — Init. Read spec, set V1 hypothesis, surfaced 5 untested assumptions.
