# ADR-001: Shared Simulation Clock and Derived Position Calculation

- Status: Accepted
- Date: 2026-02-18
- Owners: Frontend
- Related integrations: INT-002, INT-003, INT-004, INT-005, INT-006, INT-009
- Related chunks: CH-001, CH-002, CH-003, CH-004, CH-008
- Related features: FEAT-001, FEAT-005, FEAT-006

## Context

SpeedPlane compares many objects in parallel and must remain deterministic across start/pause/reset cycles.
The PRD and TAD require a shared simulation clock, real unit conversion, and mathematically correct position updates.

Without a single timing source, per-lane timers can drift, produce inconsistent finish order, and make tests flaky.

## Decision

Adopt one simulation engine time source for all tracks and derive every track position from elapsed time:

- Single shared elapsed time owned by the engine.
- No per-track timers.
- Convert speed once with `speedMs = speedKmh / 3.6`.
- Compute position from `distanceMeters = speedMs * elapsedSeconds`.
- Clamp rendered position at finish line distance for each frame.
- Drive elapsed time via `requestAnimationFrame` timestamps, not frame-count increments.

## Consequences

### Positive

- Deterministic ordering and repeatable behavior across runs.
- Simpler state model in Zustand store/reducer because tracks do not own clocks.
- Easier tests for pause/resume/reset and conversion correctness.
- Direct alignment with PRD FR3/5.6 and TAD sections 3.1, 3.2, 7, and 8.

### Negative

- UI must always read from engine-derived values, not local animation state.
- Rendering depends on proper clamping/scaling logic to avoid visual overflow.
- Future time-multiplier work must integrate with the shared clock path only.

## Rejected Alternatives

1. Per-track interval timers (`setInterval` per lane).
   - Rejected due to drift and non-determinism under browser scheduling variance.
2. Frame-step position increments (`position += speedPerFrame`).
   - Rejected because frame-rate variance breaks physics correctness.
3. Store mutable track position in state as source of truth.
   - Rejected because accumulated floating error and pause/resume edge cases are harder to control.

## Guardrails and Validation

- Unit tests must cover conversion (`km/h -> m/s`), elapsed-time position derivation, and clamp-at-finish behavior.
- Engine tests must verify deterministic pause/resume/reset transitions.
- State-layer tests must confirm no per-track timer ownership.
- Integration tests must verify consistent finish ordering for mixed-speed tracks.

## Rollback Path

If this architecture blocks delivery, rollback to a non-animated static comparison mode while preserving:

- shared object catalog and conversion utilities (INT-001/INT-002),
- track rendering baseline,
- start/pause/reset controls disabled or no-op.

Do not introduce per-track timers as a rollback strategy.
