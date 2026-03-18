# FEAT-005 Simulation Controls

## Scope
Implement Start, Pause, and Reset controls with safe state transitions.

## Dependencies
- Chunks: CH-002, CH-003, CH-005
- Integrations: INT-003, INT-005, INT-007

## Build steps
1. [x] Bind control actions to engine API methods through Zustand store actions.
2. [x] Prevent invalid transitions (e.g., pause while idle, duplicate start while running).
3. [x] Ensure reset returns elapsed time and lane positions to zero.

## CH-005 execution notes
- Mounted a controls panel in `App` as always-on MVP behavior.
- Added shared UI `Button` primitive in `src/components/ui`.
- Added store guards so invalid control transitions no-op instead of dispatching side effects.
- Added store tests for transition validity and reset alignment across all lanes.
- Fixed browser integration by binding `requestAnimationFrame`/`cancelAnimationFrame` to `globalThis` in default store time-controller wiring.
- Validated completion with `bun run build` (37 passing tests).

## Rollback path
- Revert the CH-005 slice to restore the prior baseline rendering behavior.

## Acceptance criteria
- [x] Start begins deterministic progression.
- [x] Pause freezes elapsed-time progression.
- [x] Reset restores initial state consistently.
