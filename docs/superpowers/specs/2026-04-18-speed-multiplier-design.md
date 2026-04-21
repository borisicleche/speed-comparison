# Speed Multiplier — Design Spec

**Date:** 2026-04-18

## Summary

Add a 1×/2×/3× speed multiplier dropdown that scales how fast the simulation clock advances. The setting persists across resets and can be changed mid-run.

---

## Engine layer (`src/engine/simulationEngine.ts`)

- Add `private speedMultiplier: 1 | 2 | 3 = 1`
- Add `setSpeedMultiplier(multiplier: 1 | 2 | 3): void` — sets the field and calls `notify()`
- `advanceTo` scales the delta: `this.elapsedTimeSeconds += (deltaMs / 1000) * this.speedMultiplier`
- `getSnapshot()` gains `speedMultiplier: 1 | 2 | 3` so the store stays in sync
- The multiplier does **not** reset on `reset()` or `setDistance()` — it is a persistent setting, not run state

---

## Store & reducer layer

### `src/store/simulationReducer.ts`

- Add `SpeedMultiplier = 1 | 2 | 3` type alias
- Add `speedMultiplier: SpeedMultiplier` to `SimulationEngineState` (default `1`)
- `ENGINE_SYNC` carries the new snapshot field through — no new action type needed
- `createInitialSimulationState` initialises `engine.speedMultiplier` to `1`

### `src/store/simulationStore.ts`

- Add `setSpeedMultiplier(multiplier: SpeedMultiplier): void` to `SimulationStoreState`
- Implementation: calls `engine.setSpeedMultiplier(multiplier)` — the engine `notify()` triggers `ENGINE_SYNC` which updates Zustand automatically

---

## UI layer (`src/components/SimulationOptions/`)

- Add a second `simulation-options__item` in `SimulationOptions.tsx` with a `<Select>` dropdown
- Options: `1×` (value `1`), `2×` (value `2`), `3×` (value `3`)
- Reads `simulationState.engine.speedMultiplier` from the store
- Calls `setSpeedMultiplier` on change (parse value as number, cast to `SpeedMultiplier`)
- No new SCSS rules needed — existing `.simulation-options__item` and `.simulation-options__label` classes apply

---

## Testing

- Unit test `SimulationEngine.setSpeedMultiplier`: verify `advanceTo` advances elapsed time at the correct rate for each multiplier value
- Unit test reducer: verify `ENGINE_SYNC` action propagates `speedMultiplier` into state
- Unit test store: verify `setSpeedMultiplier` updates `simulationState.engine.speedMultiplier`
- Existing engine and store tests must continue to pass unchanged
