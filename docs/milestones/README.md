# Milestones — Freshy

Operational checklists tied to [roadmap phases](../roadmap.md). Each milestone is a **gate**: complete every item before coding the next phase.

## Milestone vs roadmap

| Document | Role | Answers |
| -------- | ---- | ------- |
| **[roadmap.md](../roadmap.md)** | Product and engineering backlog | _What_ to build, in what order? |
| **milestones/** (this folder) | Operational prep per phase | _What to configure_ (accounts, deploy, decisions) before coding? |
| **[development-cycle.md](../development-cycle.md)** | Code workflow (TDD) | _How_ to implement each roadmap item? |

Former `todo_0.md` content is **one milestone** — Phase 0 bootstrap. It is not multiple milestones in one file: the full checklist to exit Phase 0 and start Phase 1 (map with real data).

## Active milestones

| Milestone | Document | Roadmap phase | Scope |
| --------- | -------- | ------------- | ----- |
| **0 — Bootstrap** | [phase-0-bootstrap.md](phase-0-bootstrap.md) | Phase 0 — Foundation | Local env, pilot city, Mapbox, remote Postgres, Cloudflare Pages, R2/CI, product decisions, visual QA |
| **1 — Map** | _(future)_ | Phase 1 — Places & Map | Created if the phase needs manual setup beyond code |
| **2+** | _(future)_ | Phases 2–7 | One doc per phase when operational steps exist |

## Milestone 0 exit criteria

App live on the internet with Freshy branding (colors, typography, bottom nav) — still **without** a real map or places API. Then continue to [Phase 1 in the roadmap](../roadmap.md#phase-1--places--map-read-only-mvp).

---

_Last updated: June 2026_
