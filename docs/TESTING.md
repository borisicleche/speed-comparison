# Testing Strategy

Test and quality gates for SpeedPlane implementation.

## Quality invariants
Moved from PRD/TAD/integration docs:

- Position math is deterministic and elapsed-time based.
- Speed conversion is correct (`km/h -> m/s`).
- No per-track timers.
- Track position clamps at finish line.
- Reset returns all lanes to start.
- Desktop and tablet remain usable.

## Test levels
### Unit tests
- Unit conversion (`km/h`, `m`, `km`) edge cases.
- Simulation engine start/pause/reset behavior.
- Store control transition guards (`start/pause/reset`) enforce valid state transitions only.
- Store default browser time-controller wiring binds global rAF/cancel APIs and advances elapsed time.
- Reducer transitions for add/remove/select/distance actions.
- Track position derivation (`distance -> progress`) clamping and proportional scaling.
- CH-007 store distance guards: invalid values no-op and unit-only switches preserve running engine state.

### Integration tests
- Engine + Zustand store wiring updates track positions consistently.
- Changing object updates derived speed and position.
- Changing distance/unit rescales lanes safely.
- Track visual selectors map all lanes from one shared elapsed-time snapshot.
- CH-005 controls flow covered: invalid transitions no-op and reset realigns every lane to start.
- CH-006 reducer coverage: max-lane bound + safe default object fallback.
- CH-007 distance store flow: meter-equivalent unit switches update state without resetting the shared clock.

### Manual tests
- Start/Pause/Reset flow correctness.
- Buttons are enabled/disabled only for valid transitions (idle, running, paused states).
- Add/remove lane behavior at lane limit.
- Large speed differences (airplane vs walking human).
- Responsive checks on desktop and tablet widths.

### E2E tests (Playwright)
- CH-006 lane management flow: add lane, remove lane, enforce max limit, and disable add at capacity.
- CH-006 object-selection flow: per-lane dropdown updates lane name/speed instantly.
- CH-005 control-state flow: `Start`/`Pause`/`Reset` button states and status labels follow valid transitions.
- CH-005 runtime behavior: track progress advances while running, stays stable when paused, and resets to zero on reset.
- CH-007 distance+units flow: unit/amount edits stay draft until `Apply`, distance changes rescale progress safely on `Apply`, and invalid input is blocked/corrected.

## Release gates
Moved from checklists:

- Required chunks completed.
- Unit/integration test suite green.
- Manual acceptance scenarios green.
- Regression review completed.
- Rollback path validated (revert latest PR-sized slice if needed).

## Reference checklists
- `/Users/nikolaborisic/Speed comparison/docs/integration/checklists/integration-readiness-checklist.md`
- `/Users/nikolaborisic/Speed comparison/docs/integration/checklists/feature-release-checklist.md`
