---
role: devops
owner: minikai
status: active
last-updated: 2026-06-06
---

# DevOps — Serving & Cache

## Scope
Owns the local static server, the cache-busting toolkit install (URL fingerprinting, anti-cache meta, version token + on-save re-bump watcher, visual badge), and version-token wiring.

## Decisions
| Date | Decision | Rationale | Linked roles |
|---|---|---|---|
| 2026-06-06 | Serve via a static file server on localhost (no backend); install cache-busting skill for freshness + version badge | Spec §7 (local gallery, no build); user requirement for cache-busting + badge. | [[ux]] |

## Dead Ends
<!-- APPEND ONLY. Never delete. -->
| Date | What was tried | Why it failed / was rejected |
|---|---|---|

## Lessons

## Open Questions
- [x] Cache-busting ≠ semantic version control — RESOLVED 2026-06-06: user wants BOTH. Cache-busting badge/token for freshness + a git repo (kai-denrei identity) for real version history/rollback.

## Assumptions
- A no-build static server (e.g. `python3 -m http.server` or equivalent) is acceptable for localhost V1. — status: untested — since: 2026-06-06

## Dependencies
Blocked by:
Feeds into: [[ux]]

## Session Log
2026-06-06 — Init.
