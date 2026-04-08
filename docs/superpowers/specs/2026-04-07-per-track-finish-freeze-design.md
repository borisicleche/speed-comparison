# Per-Track Finish Freeze & Auto-Stop

**Date:** 2026-04-07

## Problem

Once a track's object reaches the finish line, its elapsed time and position should freeze. The remaining tracks continue running. When every track has finished, the simulation auto-stops.

## Approach

Pure selector computation — no new state, no engine changes. The finish time for any track is deterministic: `finishTimeSeconds = trackLengthMeters / speedMetersPerSecond`. This is derived at render time, consistent with the existing invariant that position is always derived, never stored.

## Changes

### 1. `src/store/simulationSelectors.ts` — `selectTrackDerivedState`

Replace the single distance computation with a finish-aware version:

```ts
const naturalDistanceMeters = speedMs * state.engine.elapsedTimeSeconds;
const isFinished = naturalDistanceMeters >= state.distance.value;
const effectiveElapsedSeconds = isFinished
  ? state.distance.value / speedMs   // exact freeze point
  : state.engine.elapsedTimeSeconds;
const distanceMeters = isFinished ? state.distance.value : naturalDistanceMeters;
```

`elapsedTimeSeconds` in the returned `TrackDerivedState` becomes `effectiveElapsedSeconds`. No state shape changes.

- Division by zero is not possible: `isFinished` requires `naturalDistanceMeters >= state.distance.value > 0`, which requires `speedMs > 0`.
- The frozen elapsed time is exact (formula-derived), not approximate (tick-sampled).

### 2. `src/store/simulationStore.ts` — engine subscriber

After dispatching `ENGINE_SYNC`, check whether all tracks have finished and auto-stop:

```ts
unsubscribeEngine = engine.subscribe(() => {
  const snapshot = engine.getSnapshot();

  store.getState().dispatch({
    type: SimulationActionType.ENGINE_SYNC,
    snapshot,
  });

  if (snapshot.isRunning) {
    const tracks = selectTrackVisualStates(store.getState().simulationState);
    if (tracks.length > 0 && tracks.every((t) => t.isFinished)) {
      engine.pause();
      timeController.stop();
    }
  }
});
```

The state is read after the dispatch so it reflects the current elapsed time. The `isRunning` guard prevents re-triggering on an already-stopped engine.

## Invariants preserved

- **One shared clock.** `SimulationEngine.elapsedTimeSeconds` remains the single source of truth. No per-track timers.
- **Position is always derived.** Freeze is computed in the selector, not stored.
- **Engine invariants unchanged.** `setDistance` still resets, `advanceTo` still drives the rAF loop.

## Testing

### Selector unit tests (`simulationSelectors.test.ts`)

- Running track (not yet finished): `elapsedTimeSeconds` equals global clock; `distanceMeters` equals natural distance; `isFinished` is false.
- Finished track: `elapsedTimeSeconds` equals `trackLength / speedMs` (frozen); `distanceMeters` equals `trackLength`; `isFinished` is true.
- Frozen `elapsedTimeSeconds` does not exceed global clock.

### Store integration tests (`simulationStore.test.ts`)

- When engine advances past the finish for all tracks, engine auto-stops (`isRunning` becomes false).
- When only some tracks are finished, engine keeps running.
- After auto-stop, calling `startSimulation` resumes correctly (regression).

## Out of scope

- Finish order display (e.g. "1st", "2nd" badges) — not requested.
- Per-track manual pause — not requested.
