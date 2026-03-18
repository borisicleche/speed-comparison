# Implementation Plan

This is the execution view for building SpeedPlane feature-by-feature.

## Source of truth
Moved from integration docs and linked here:

- Integration inventory: `/Users/nikolaborisic/Speed comparison/docs/integration/00-integration-inventory.md`
- Chunk plan: `/Users/nikolaborisic/Speed comparison/docs/integration/01-chunk-plan.md`
- Feature map: `/Users/nikolaborisic/Speed comparison/docs/integration/02-feature-to-integration-map.md`

## Execution order (chunks)
Moved from `/Users/nikolaborisic/Speed comparison/docs/integration/01-chunk-plan.md`:

1. CH-001 Domain Foundations
2. CH-002 Simulation Core
3. CH-003 State Bridge
4. CH-004 Baseline Track UI
5. CH-005 Simulation Controls
6. CH-006 Track Management
7. CH-007 Distance + Units
8. CH-008 Hardening + Release Gates

## Feature-by-feature delivery
Moved from `/Users/nikolaborisic/Speed comparison/docs/integration/02-feature-to-integration-map.md`:

1. FEAT-001 Track Visualization
2. FEAT-002 Multiple Tracks
3. FEAT-003 Object Selection
4. FEAT-004 Distance and Units
5. FEAT-005 Simulation Controls
6. FEAT-006 Deterministic Physics
7. FEAT-007 Responsive Layout
8. FEAT-008 Future Enhancements (post-MVP)

## Active status board
Use this table as the day-to-day tracker.

| Item | Status (`Planned/In progress/Done/Blocked`) | Owner | Notes |
|---|---|---|---|
| CH-001 | Done | Codex | INT-001 and INT-002 implemented with unit tests and fixtures |
| CH-002 | Done | Codex | INT-003 and INT-004 shared-clock engine + rAF bridge + deterministic tests |
| CH-003 | Done | Codex | INT-005 Zustand store/reducer bridge + selectors + store transition tests |
| CH-004 | Done | Codex | INT-006 and INT-008 TrackList/Track baseline UI, deterministic clamp helper tests, PR-sized rollback path |
| CH-005 | Done | Codex | INT-007 controls panel shipped with transition guards, reset alignment coverage, and browser rAF binding fix |
| CH-006 | Done | Codex | INT-007/INT-001/INT-005 integrated: add/remove lanes, per-lane object dropdowns, bounded lane limit, and CH-006 Playwright/UI coverage |
| CH-007 | Done | Codex | INT-002/INT-006/INT-007 delivered: DistanceInput UI with apply-gated unit/amount edits, invalid-input guards, and CH-007 Playwright coverage |
| CH-008 | Planned | TBD | |

## Per-feature implementation workflow
1. Open the relevant file in `/Users/nikolaborisic/Speed comparison/docs/integration/features/`.
2. Confirm required chunks are done.
3. Implement as always-on MVP behavior in small, reversible slices.
4. Run testing plan from `/Users/nikolaborisic/Speed comparison/docs/TESTING.md`.
5. Complete release checklist in `/Users/nikolaborisic/Speed comparison/docs/integration/checklists/feature-release-checklist.md`.
