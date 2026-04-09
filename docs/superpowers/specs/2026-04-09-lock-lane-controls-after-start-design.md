# Design: Lock Lane Controls After Simulation Start

**Date:** 2026-04-09

## Problem

Lane distance editing and object selection are currently disabled only while the simulation is actively running (`isRunning`). When the simulation is paused mid-run, these controls become re-enabled, allowing configuration changes on a simulation that is no longer at the zero start position. This is confusing — the simulation state no longer reflects any edits made at that point.

## Behaviour

Once `elapsedTimeSeconds > 0`, both per-lane controls are locked:

1. **Distance edit** — the Edit button (and all distance editing inputs/selects) are disabled.
2. **Object select** — the lane object dropdown is disabled.

These controls remain locked until the simulation is reset (`elapsedTimeSeconds` returns to 0). While running (`isRunning`), the behaviour is unchanged (controls were already disabled).

## Implementation

Replace the `isRunning` prop flowing through `App → TrackList → Track` with `isLocked`, computed as `elapsedTimeSeconds > 0`.

### Files changed

**`src/app/App.tsx`**
- Add `elapsedTimeSeconds` selector from `state.simulationState.engine.elapsedTimeSeconds`
- Remove the `isRunning` selector (no longer needed at this level)
- Compute `isLocked = elapsedTimeSeconds > 0`
- Pass `isLocked` to `TrackList` instead of `isRunning`

**`src/components/TrackList/TrackList.tsx`**
- Rename prop `isRunning → isLocked` in type and usage

**`src/components/Track/Track.tsx`**
- Rename prop `isRunning → isLocked` in type and usage
- All five `disabled={isRunning}` occurrences become `disabled={isLocked}`

## Out of scope

- The global distance input (`DistanceInput`) — already resets simulation on change via `engine.setDistance`, so no lock needed there.
- The Remove lane button — intentionally left always-available (removing a finished lane mid-pause is valid).
- The Add lane button in `SetupPanel` — adding lanes while paused is currently allowed and not in scope.
