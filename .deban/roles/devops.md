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
| 2026-06-06 | install.sh's default root-relative cb asset refs (`/cb-shapes/…`, `/cb-badge.js`) | Toolkit assumes `public/` IS the web root; here the server root is the project root, so those 404'd. Worked around by pointing refs at `/public/…`. Reverts cleanly if served with `--directory public`. |

## Lessons

## Open Questions
- [x] Cache-busting ≠ semantic version control — RESOLVED 2026-06-06: user wants BOTH. Cache-busting badge/token for freshness + a git repo (kai-denrei identity) for real version history/rollback.

## Assumptions
- A no-build static server (e.g. `python3 -m http.server` or equivalent) is acceptable for localhost V1. — status: untested — since: 2026-06-06

## Dependencies
Blocked by:
Feeds into: [[ux]]

## Session Log
2026-06-06 — Added PWA: hand-written service-worker.js (no Workbox/Vite — honors the no-build constraint), manifest, offline.html, Pillow-generated icons (192/512/maskable/apple-180). SW cache version keyed to the cb token via the ?v= it's registered with, so bust.sh bumps already drive SW updates. Gated update toast (no unprompted skipWaiting). All assets serve 200.
2026-06-06 — Cache-busting installed (token 7297a1e4); bust.sh confirmed re-fingerprinting and preserving the /public/ favicon prefix across bumps. WebP skipped (no libcairo).
2026-06-06 — Init.
