# Speed Multiplier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 1×/2×/3× speed multiplier that scales the simulation clock, persists across resets, and can be changed mid-run via a dropdown in SimulationOptions.

**Architecture:** The engine owns the multiplier as a private field and applies it in `advanceTo`. The store exposes `setSpeedMultiplier` which calls the engine directly; the engine's `notify()` triggers an `ENGINE_SYNC` which propagates the new value to Zustand automatically. The UI reads `simulationState.engine.speedMultiplier` and calls the store action on change.

**Tech Stack:** TypeScript, Bun test runner, React, Zustand, SCSS

---

## File Map

| Action | Path |
|--------|------|
| Modify | `src/engine/simulationEngine.ts` |
| Modify | `src/engine/simulationEngine.test.ts` |
| Modify | `src/store/simulationReducer.ts` |
| Modify | `src/store/simulationReducer.test.ts` |
| Modify | `src/store/simulationStore.ts` |
| Modify | `src/store/simulationStore.test.ts` |
| Modify | `src/components/SimulationOptions/SimulationOptions.tsx` |

---

## Task 1: Engine — speedMultiplier field, setter, snapshot, and advanceTo scaling

**Files:**
- Modify: `src/engine/simulationEngine.ts`
- Modify: `src/engine/simulationEngine.test.ts`

- [ ] **Step 1: Write failing tests for new multiplier behavior**

Add these tests to the bottom of the `describe` block in `src/engine/simulationEngine.test.ts`:

```typescript
test("setSpeedMultiplier(2) advances elapsed time at 2× rate", () => {
  const engine = new SimulationEngine();

  engine.setSpeedMultiplier(2);
  engine.start();
  engine.advanceTo(0);
  engine.advanceTo(1000);

  expect(engine.getElapsedTime()).toBeCloseTo(2, 12);
});

test("setSpeedMultiplier(3) advances elapsed time at 3× rate", () => {
  const engine = new SimulationEngine();

  engine.setSpeedMultiplier(3);
  engine.start();
  engine.advanceTo(0);
  engine.advanceTo(1000);

  expect(engine.getElapsedTime()).toBeCloseTo(3, 12);
});

test("getSnapshot includes speedMultiplier and reflects setSpeedMultiplier", () => {
  const engine = new SimulationEngine();

  expect(engine.getSnapshot().speedMultiplier).toBe(1);

  engine.setSpeedMultiplier(2);
  expect(engine.getSnapshot().speedMultiplier).toBe(2);
});

test("reset does not clear speedMultiplier", () => {
  const engine = new SimulationEngine();

  engine.setSpeedMultiplier(3);
  engine.start();
  engine.advanceTo(0);
  engine.advanceTo(500);
  engine.reset();

  expect(engine.getSnapshot().speedMultiplier).toBe(3);
});

test("setDistance does not clear speedMultiplier", () => {
  const engine = new SimulationEngine();

  engine.setSpeedMultiplier(2);
  engine.setDistance(2000);

  expect(engine.getSnapshot().speedMultiplier).toBe(2);
});

test("setSpeedMultiplier notifies subscribers", () => {
  const engine = new SimulationEngine();
  let notifications = 0;
  engine.subscribe(() => { notifications += 1; });

  engine.setSpeedMultiplier(2);
  expect(notifications).toBe(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/engine/simulationEngine.test.ts
```

Expected: new tests fail (property `speedMultiplier` does not exist / `setSpeedMultiplier` is not a function).

- [ ] **Step 3: Implement all engine changes**

Replace `src/engine/simulationEngine.ts` with:

```typescript
export type SimulationListener = () => void;

export type SimulationSnapshot = {
  elapsedTimeSeconds: number;
  isRunning: boolean;
  trackLengthMeters: number;
  speedMultiplier: 1 | 2 | 3;
};

const DEFAULT_TRACK_LENGTH_METERS = 1000;

export class SimulationEngine {
  private elapsedTimeSeconds = 0;
  private isRunning = false;
  private trackLengthMeters = DEFAULT_TRACK_LENGTH_METERS;
  private lastFrameTimeMs: number | null = null;
  private listeners = new Set<SimulationListener>();
  private speedMultiplier: 1 | 2 | 3 = 1;

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  reset(): void {
    this.elapsedTimeSeconds = 0;
    this.isRunning = false;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  setDistance(trackLengthMeters: number): void {
    this.trackLengthMeters = trackLengthMeters;

    // TAD invariant: distance changes reset active simulation state.
    this.elapsedTimeSeconds = 0;
    this.isRunning = false;
    this.lastFrameTimeMs = null;

    this.notify();
  }

  setSpeedMultiplier(multiplier: 1 | 2 | 3): void {
    this.speedMultiplier = multiplier;
    this.notify();
  }

  subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getElapsedTime(): number {
    return this.elapsedTimeSeconds;
  }

  getSnapshot(): SimulationSnapshot {
    return {
      elapsedTimeSeconds: this.elapsedTimeSeconds,
      isRunning: this.isRunning,
      trackLengthMeters: this.trackLengthMeters,
      speedMultiplier: this.speedMultiplier,
    };
  }

  advanceTo(frameTimeMs: number): void {
    if (!this.isRunning) {
      return;
    }

    if (this.lastFrameTimeMs === null) {
      this.lastFrameTimeMs = frameTimeMs;
      return;
    }

    const deltaMs = frameTimeMs - this.lastFrameTimeMs;

    if (deltaMs <= 0) {
      this.lastFrameTimeMs = frameTimeMs;
      return;
    }

    this.elapsedTimeSeconds += (deltaMs / 1000) * this.speedMultiplier;
    this.lastFrameTimeMs = frameTimeMs;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
```

- [ ] **Step 4: Update the two existing snapshot `toEqual` assertions**

The `reset clears elapsed time` and `setDistance updates distance` tests use `toEqual` on the full snapshot — they must now include `speedMultiplier: 1`.

In `src/engine/simulationEngine.test.ts`, find and update:

```typescript
// "reset clears elapsed time and running state" — change the expect to:
expect(engine.getSnapshot()).toEqual({
  elapsedTimeSeconds: 0,
  isRunning: false,
  trackLengthMeters: 1000,
  speedMultiplier: 1,
});
```

```typescript
// "setDistance updates distance and resets simulation" — change the expect to:
expect(engine.getSnapshot()).toEqual({
  elapsedTimeSeconds: 0,
  isRunning: false,
  trackLengthMeters: 5000,
  speedMultiplier: 1,
});
```

- [ ] **Step 5: Run all engine tests and verify they all pass**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/engine/simulationEngine.test.ts
```

Expected: all 12 tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/Users/nikolaborisic/Speed comparison" && git add src/engine/simulationEngine.ts src/engine/simulationEngine.test.ts && git commit -m "feat(engine): add speedMultiplier field, setter, and advanceTo scaling"
```

---

## Task 2: Reducer — SpeedMultiplier type, SimulationEngineState, ENGINE_SYNC

**Files:**
- Modify: `src/store/simulationReducer.ts`
- Modify: `src/store/simulationReducer.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `src/store/simulationReducer.test.ts` inside the `describe` block:

```typescript
test("initial state has speedMultiplier 1", () => {
  const state = createInitialSimulationState();

  expect(state.engine.speedMultiplier).toBe(1);
});

test("ENGINE_SYNC propagates speedMultiplier from snapshot", () => {
  const state = createInitialSimulationState();

  const snapshot: SimulationSnapshot = {
    elapsedTimeSeconds: 1.5,
    isRunning: true,
    trackLengthMeters: 1000,
    speedMultiplier: 3,
  };

  const nextState = simulationReducer(state, {
    type: SimulationActionType.ENGINE_SYNC,
    snapshot,
  });

  expect(nextState.engine.speedMultiplier).toBe(3);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/store/simulationReducer.test.ts
```

Expected: 2 new tests fail; existing tests fail to compile because `SimulationSnapshot` now requires `speedMultiplier` and the existing snapshot literal in the test is missing it.

- [ ] **Step 3: Implement reducer changes**

In `src/store/simulationReducer.ts`, make the following changes:

**a) Add `SpeedMultiplier` type after the imports:**

```typescript
export type SpeedMultiplier = 1 | 2 | 3;
```

**b) Update `SimulationEngineState`:**

```typescript
export type SimulationEngineState = {
  elapsedTimeSeconds: number;
  isRunning: boolean;
  speedMultiplier: SpeedMultiplier;
};
```

**c) Update `createInitialSimulationState` — the `engine` field:**

```typescript
engine: {
  elapsedTimeSeconds: 0,
  isRunning: false,
  speedMultiplier: 1,
},
```

**d) Update the `ENGINE_SYNC` case — the `engine` spread:**

```typescript
engine: {
  elapsedTimeSeconds: action.snapshot.elapsedTimeSeconds,
  isRunning: action.snapshot.isRunning,
  speedMultiplier: action.snapshot.speedMultiplier,
},
```

- [ ] **Step 4: Fix the existing engine-sync test snapshot literal**

In `src/store/simulationReducer.test.ts`, find `"engine sync updates running state"` test and update the snapshot literal and the engine expectation:

```typescript
const snapshot: SimulationSnapshot = {
  elapsedTimeSeconds: 3.25,
  isRunning: true,
  trackLengthMeters: 500,
  speedMultiplier: 1,
};
```

```typescript
expect(nextState.engine).toEqual({
  elapsedTimeSeconds: 3.25,
  isRunning: true,
  speedMultiplier: 1,
});
```

Also update `"initial state includes default lanes and shared engine state"` to include `speedMultiplier`:

```typescript
expect(state.engine).toEqual({ elapsedTimeSeconds: 0, isRunning: false, speedMultiplier: 1 });
```

- [ ] **Step 5: Run all reducer tests and verify they all pass**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/store/simulationReducer.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/Users/nikolaborisic/Speed comparison" && git add src/store/simulationReducer.ts src/store/simulationReducer.test.ts && git commit -m "feat(reducer): add SpeedMultiplier type and propagate via ENGINE_SYNC"
```

---

## Task 3: Store — setSpeedMultiplier action

**Files:**
- Modify: `src/store/simulationStore.ts`
- Modify: `src/store/simulationStore.test.ts`

- [ ] **Step 1: Write failing test**

Add to `src/store/simulationStore.test.ts` inside the `describe` block:

```typescript
test("setSpeedMultiplier updates simulationState.engine.speedMultiplier", () => {
  const engine = new SimulationEngine();
  const store = createSimulationStore({
    engine,
    timeController: { start: () => {}, stop: () => {} },
  });

  expect(store.getState().simulationState.engine.speedMultiplier).toBe(1);

  store.getState().setSpeedMultiplier(2);
  expect(store.getState().simulationState.engine.speedMultiplier).toBe(2);

  store.getState().setSpeedMultiplier(3);
  expect(store.getState().simulationState.engine.speedMultiplier).toBe(3);

  store.getState().setSpeedMultiplier(1);
  expect(store.getState().simulationState.engine.speedMultiplier).toBe(1);
});

test("setSpeedMultiplier mid-run scales subsequent advances", () => {
  const engine = new SimulationEngine();
  const store = createSimulationStore({
    engine,
    timeController: { start: () => {}, stop: () => {} },
  });

  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(1000); // 1s at 1×

  store.getState().setSpeedMultiplier(2);
  engine.advanceTo(2000); // 1s at 2× = +2s → total 3s

  expect(store.getState().simulationState.engine.elapsedTimeSeconds).toBeCloseTo(3, 12);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/store/simulationStore.test.ts
```

Expected: 2 new tests fail (`setSpeedMultiplier` is not a function).

- [ ] **Step 3: Implement store changes**

In `src/store/simulationStore.ts`:

**a) Update the import from `./simulationReducer` to include `SpeedMultiplier`:**

```typescript
import {
  createInitialSimulationState,
  simulationReducer,
  SimulationActionType,
  type SimulationAction,
  type SimulationState,
  type SpeedMultiplier,
} from "./simulationReducer";
```

**b) Add `setSpeedMultiplier` to `SimulationStoreState`:**

```typescript
export type SimulationStoreState = {
  simulationState: SimulationState;
  dispatch: (action: SimulationAction) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  resetSimulation: () => void;
  setDistance: (value: number, unit: DistanceUnit) => void;
  addTrack: (objectId?: string) => void;
  removeTrack: (trackId: string) => void;
  setTrackObject: (trackId: string, objectId: string) => void;
  setPauseOnFinish: (enabled: boolean) => void;
  setSpeedMultiplier: (multiplier: SpeedMultiplier) => void;
  destroyStore: () => void;
};
```

**c) Add the implementation inside `createStore((set, get) => ({ ... }))`, after `setPauseOnFinish`:**

```typescript
setSpeedMultiplier: (multiplier) => {
  engine.setSpeedMultiplier(multiplier);
},
```

- [ ] **Step 4: Run all store tests and verify they all pass**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun test src/store/simulationStore.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Run the full test suite**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun run build
```

Expected: all tests pass, no type errors.

- [ ] **Step 6: Commit**

```bash
cd "/Users/nikolaborisic/Speed comparison" && git add src/store/simulationStore.ts src/store/simulationStore.test.ts && git commit -m "feat(store): add setSpeedMultiplier action"
```

---

## Task 4: UI — Speed multiplier dropdown in SimulationOptions

**Files:**
- Modify: `src/components/SimulationOptions/SimulationOptions.tsx`

- [ ] **Step 1: Implement the dropdown**

Replace `src/components/SimulationOptions/SimulationOptions.tsx` with:

```tsx
import React from "react";

import { type SpeedMultiplier } from "../../store/simulationReducer";
import { useSimulationStore } from "../../store/simulationStore";
import { Select } from "../ui/select";

export const SimulationOptions = () => {
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);
  const speedMultiplier = useSimulationStore(
    (state) => state.simulationState.engine.speedMultiplier,
  );
  const setSpeedMultiplier = useSimulationStore((state) => state.setSpeedMultiplier);

  const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPauseOnFinish(e.target.checked);

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSpeedMultiplier(Number(e.target.value) as SpeedMultiplier);

  return (
    <section className="simulation-options" aria-label="Simulation options">
      <p className="simulation-options__title">Options</p>
      <div className="simulation-options__item">
        <input
          id="pause-on-finish"
          type="checkbox"
          checked={pauseOnFinish}
          onChange={handlePauseChange}
        />
        <label className="simulation-options__label" htmlFor="pause-on-finish">
          Pause when each track finishes
        </label>
      </div>
      <div className="simulation-options__item">
        <label className="simulation-options__label" htmlFor="speed-multiplier">
          Speed
        </label>
        <Select
          id="speed-multiplier"
          value={speedMultiplier}
          onChange={handleMultiplierChange}
        >
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </Select>
      </div>
    </section>
  );
};
```

- [ ] **Step 2: Run build to verify no type errors**

```bash
cd "/Users/nikolaborisic/Speed comparison" && bun run build
```

Expected: all tests pass, zero TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/nikolaborisic/Speed comparison" && git add src/components/SimulationOptions/SimulationOptions.tsx && git commit -m "feat(ui): add speed multiplier dropdown to SimulationOptions"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Engine: `private speedMultiplier: 1 | 2 | 3 = 1` — Task 1
- ✅ Engine: `setSpeedMultiplier(multiplier)` — Task 1
- ✅ Engine: `advanceTo` scales by multiplier — Task 1
- ✅ Engine: `getSnapshot()` gains `speedMultiplier` — Task 1
- ✅ Engine: multiplier does NOT reset on `reset()` — Task 1 (test + impl)
- ✅ Engine: multiplier does NOT reset on `setDistance()` — Task 1 (test + impl)
- ✅ Reducer: `SpeedMultiplier` type alias — Task 2
- ✅ Reducer: `speedMultiplier` in `SimulationEngineState` (default 1) — Task 2
- ✅ Reducer: `ENGINE_SYNC` propagates `speedMultiplier` — Task 2
- ✅ Reducer: `createInitialSimulationState` sets `speedMultiplier: 1` — Task 2
- ✅ Store: `setSpeedMultiplier` on `SimulationStoreState` — Task 3
- ✅ Store: calls `engine.setSpeedMultiplier` (notify → ENGINE_SYNC → Zustand) — Task 3
- ✅ UI: second `simulation-options__item` with `<Select>` — Task 4
- ✅ UI: options 1×/2×/3× — Task 4
- ✅ UI: reads `simulationState.engine.speedMultiplier` — Task 4
- ✅ UI: calls `setSpeedMultiplier` on change — Task 4
- ✅ Unit tests: engine multiplier scaling — Task 1
- ✅ Unit tests: ENGINE_SYNC propagates speedMultiplier — Task 2
- ✅ Unit tests: store setSpeedMultiplier — Task 3
- ✅ Existing tests updated to compile and pass — Tasks 1, 2
