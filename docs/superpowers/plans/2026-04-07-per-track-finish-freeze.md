# Per-Track Finish Freeze & Auto-Stop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze each track's elapsed time display when its object reaches the finish line, and auto-stop the engine when every track has finished.

**Architecture:** Pure selector computation — finish time is derived as `trackLength / speed` (exact, not tick-sampled). The store's engine subscriber checks after each rAF tick whether all tracks are finished and pauses the engine if so. No new state, no engine changes.

**Tech Stack:** TypeScript, Bun test runner (`bun test`), Zustand vanilla store, React.

---

## Files

| File | Change |
|---|---|
| `src/store/simulationSelectors.ts` | Modify `selectTrackDerivedState` to freeze elapsed time and distance for finished tracks |
| `src/store/simulationSelectors.test.ts` | Add tests for frozen elapsed time on finished tracks |
| `src/store/simulationStore.ts` | Add auto-stop check in the engine subscriber |
| `src/store/simulationStore.test.ts` | Add tests for auto-stop behavior |

---

## Task 1: Freeze elapsed time for finished tracks in selector

**Files:**
- Modify: `src/store/simulationSelectors.ts` (lines 53–76)
- Test: `src/store/simulationSelectors.test.ts`

**Background:**
- `airplane` speed: 900 km/h → `900 / 3.6 = 250 m/s`. Finishes 1000 m track at `1000 / 250 = 4 s`.
- `human-walking` speed: 5 km/h → `5 / 3.6 ≈ 1.389 m/s`. Finishes at `≈ 720 s`.
- `car-city-average` speed: 50 km/h → `50 / 3.6 ≈ 13.889 m/s`. Finishes at `≈ 72 s`.

- [ ] **Step 1: Write the failing tests**

Add these three `test` blocks inside the existing `describe("simulationSelectors", ...)` in `src/store/simulationSelectors.test.ts`:

```ts
test("finished track freezes elapsed time at exact finish time", () => {
  const initialState = createInitialSimulationState();
  // airplane: 900 km/h = 250 m/s, track 1000 m → finishes at 1000/250 = 4 s
  const withAirplane = simulationReducer(initialState, {
    type: SimulationActionType.ADD_TRACK,
    objectId: "airplane",
  });

  const syncedState = simulationReducer(withAirplane, {
    type: SimulationActionType.ENGINE_SYNC,
    snapshot: {
      elapsedTimeSeconds: 9,
      isRunning: true,
      trackLengthMeters: 1000,
    },
  });

  const derived = selectTrackDerivedState(syncedState, "track-3");
  expect(derived?.elapsedTimeSeconds).toBeCloseTo(4, 10);
  expect(derived?.distanceMeters).toBe(1000);
});

test("unfinished track uses global elapsed time", () => {
  const initialState = createInitialSimulationState();
  // human-walking: 5/3.6 ≈ 1.389 m/s, won't finish 1000 m in 10 s
  const syncedState = simulationReducer(initialState, {
    type: SimulationActionType.ENGINE_SYNC,
    snapshot: {
      elapsedTimeSeconds: 10,
      isRunning: true,
      trackLengthMeters: 1000,
    },
  });

  const derived = selectTrackDerivedState(syncedState, "track-1");
  expect(derived?.elapsedTimeSeconds).toBe(10);
  expect(derived?.distanceMeters).toBeCloseTo((5 / 3.6) * 10, 12);
});

test("frozen elapsed time does not exceed global clock", () => {
  const initialState = createInitialSimulationState();
  const withAirplane = simulationReducer(initialState, {
    type: SimulationActionType.ADD_TRACK,
    objectId: "airplane",
  });

  const syncedState = simulationReducer(withAirplane, {
    type: SimulationActionType.ENGINE_SYNC,
    snapshot: {
      elapsedTimeSeconds: 9,
      isRunning: true,
      trackLengthMeters: 1000,
    },
  });

  const derived = selectTrackDerivedState(syncedState, "track-3");
  expect(derived!.elapsedTimeSeconds).toBeLessThanOrEqual(9);
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

```bash
bun test src/store/simulationSelectors.test.ts
```

Expected: the three new tests FAIL (frozen elapsed time test fails because elapsedTimeSeconds is 9, not 4).

- [ ] **Step 3: Implement the freeze in `selectTrackDerivedState`**

In `src/store/simulationSelectors.ts`, replace lines 57–62 (the `speedMs` and `distanceMeters` computation up to the return object):

```ts
  const speedMs = speedToMetersPerSecond(
    speedValue,
    speedLengthUnit,
    speedTimeUnit,
  );
  const naturalDistanceMeters = speedMs * state.engine.elapsedTimeSeconds;
  const isFinished = naturalDistanceMeters >= state.distance.value;
  const effectiveElapsedSeconds = isFinished
    ? state.distance.value / speedMs
    : state.engine.elapsedTimeSeconds;
  const distanceMeters = isFinished ? state.distance.value : naturalDistanceMeters;

  return {
    trackId: track.id,
    objectId: speedObject.id,
    objectName: speedObject.name,
    objectCategory: speedObject.category,
    speedValue,
    speedTimeUnit,
    speedLengthUnit,
    speedMetersPerSecond: speedMs,
    elapsedTimeSeconds: effectiveElapsedSeconds,
    distanceMeters,
  };
```

- [ ] **Step 4: Run the full selector test file to verify all tests pass**

```bash
bun test src/store/simulationSelectors.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full suite to catch regressions**

```bash
bun run build
```

Expected: all tests PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/simulationSelectors.ts src/store/simulationSelectors.test.ts
git commit -m "feat: freeze per-track elapsed time at finish line"
```

---

## Task 2: Auto-stop engine when all tracks finish

**Files:**
- Modify: `src/store/simulationStore.ts` (lines 120–125, the engine subscriber)
- Test: `src/store/simulationStore.test.ts`

**Background:**
- Default tracks: `human-walking` (5 km/h) and `car-city-average` (50 km/h), track length 1000 m.
- Walking finishes at `1000 / (5/3.6) = 720 s`. Car finishes at `1000 / (50/3.6) = 72 s`.
- Advancing the engine to `720001 ms` means both are finished.
- Advancing to `73000 ms` means only car is finished; walking is at `≈ 101.4 m`.

- [ ] **Step 1: Write the failing tests**

Add these three `test` blocks inside `describe("simulationStore (zustand)", ...)` in `src/store/simulationStore.test.ts`:

```ts
test("engine auto-stops when all tracks finish", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { start: 0, stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => { controllerCalls.start += 1; },
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  // Default: human-walking (5 km/h) + car-city-average (50 km/h), 1000 m track.
  // Walking finishes at 720 s — advancing to 720.001 s means both are done.
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(720001);

  expect(store.getState().simulationState.engine.isRunning).toBe(false);
  expect(controllerCalls.stop).toBeGreaterThanOrEqual(1);
});

test("engine keeps running when only some tracks finish", () => {
  const engine = new SimulationEngine();

  const store = createSimulationStore({
    engine,
    timeController: { start: () => {}, stop: () => {} },
  });

  // At 73 s: car-city-average has finished (~1013 m), walking has not (~101 m).
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73000);

  expect(store.getState().simulationState.engine.isRunning).toBe(true);
});

test("simulation can be reset and restarted after auto-stop", () => {
  const engine = new SimulationEngine();

  const store = createSimulationStore({
    engine,
    timeController: { start: () => {}, stop: () => {} },
  });

  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(720001); // auto-stop

  expect(store.getState().simulationState.engine.isRunning).toBe(false);

  store.getState().resetSimulation();
  store.getState().startSimulation();

  expect(store.getState().simulationState.engine.isRunning).toBe(true);
});
```

- [ ] **Step 2: Run the new tests to verify they fail**

```bash
bun test src/store/simulationStore.test.ts
```

Expected: the three new tests FAIL (engine still running after all tracks finish).

- [ ] **Step 3: Implement auto-stop in the engine subscriber**

In `src/store/simulationStore.ts`, add the import for `selectTrackVisualStates` at the top of the file alongside the existing reducer imports:

```ts
import {
  createInitialSimulationState,
  simulationReducer,
  SimulationActionType,
  type SimulationAction,
  type SimulationState,
} from "./simulationReducer";
import { selectTrackVisualStates } from "./simulationSelectors";
```

Then replace the engine subscriber block (lines 120–125):

```ts
  unsubscribeEngine = engine.subscribe(() => {
    store.getState().dispatch({
      type: SimulationActionType.ENGINE_SYNC,
      snapshot: engine.getSnapshot(),
    });

    const snapshot = engine.getSnapshot();
    if (snapshot.isRunning) {
      const tracks = selectTrackVisualStates(store.getState().simulationState);
      if (tracks.length > 0 && tracks.every((t) => t.isFinished)) {
        engine.pause();
        timeController.stop();
      }
    }
  });
```

Note: state is read *after* `dispatch` so it reflects the just-synced elapsed time. The `isRunning` guard prevents re-triggering when `engine.pause()` fires another notification.

- [ ] **Step 4: Run the store test file to verify all tests pass**

```bash
bun test src/store/simulationStore.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Run the full suite to catch regressions**

```bash
bun run build
```

Expected: all tests PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/simulationStore.ts src/store/simulationStore.test.ts
git commit -m "feat: auto-stop engine when all tracks reach the finish line"
```
