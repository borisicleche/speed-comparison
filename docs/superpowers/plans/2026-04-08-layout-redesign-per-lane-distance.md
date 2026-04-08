# Layout Redesign & Per-Lane Distance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the app into a fixed left setup panel + top engine controls bar + scrollable lane list, with per-lane optional distance overrides that have their own amount and unit.

**Architecture:** Add `TrackDistanceOverride` to each `SimulationTrack` in the reducer; update selectors to compute `effectiveTrackLengthMeters` per track (override ?? global); add two new store helpers; replace the stacked single-column UI with a two-column shell (`SetupPanel` + `EngineControls` + `TrackList`).

**Tech Stack:** React, TypeScript, Zustand (vanilla + hooks), SCSS, Bun test runner, Playwright E2E.

---

## File map

**Modified:**
- `src/store/simulationReducer.ts` — add `TrackDistanceOverride` type, extend `SimulationTrack`, add `SET_TRACK_DISTANCE` / `CLEAR_TRACK_DISTANCE` actions, extend `ADD_TRACK` payload
- `src/store/simulationReducer.test.ts` — new tests + update existing `toEqual` assertions that check track shape
- `src/store/simulationSelectors.ts` — compute `effectiveTrackLengthMeters` per track in `selectTrackDerivedState`; add field to `TrackDerivedState`; remove `trackLengthMeters` from `TrackVisualState` (now inherited)
- `src/store/simulationSelectors.test.ts` — new tests for per-track length; update `trackLengthMeters` → `effectiveTrackLengthMeters`
- `src/store/simulationStore.ts` — add `setTrackDistance`, `clearTrackDistance`; extend `addTrack` signature
- `src/store/simulationStore.test.ts` — new tests + update `addTrack` assertion
- `src/components/Track/Track.tsx` — add inline distance override form; update `trackLengthMeters` → `effectiveTrackLengthMeters`
- `src/components/Track/Track.scss` — add `.track-card__distance-override` styles
- `src/components/TrackList/TrackList.tsx` — add `isRunning`, `onSetTrackDistance`, `onClearTrackDistance` props; pass through to `Track`
- `src/app/App.tsx` — two-column layout; wire `SetupPanel`, `EngineControls`; remove old component imports
- `src/app/App.scss` — flex two-column shell styles

**Created:**
- `src/components/SetupPanel/SetupPanel.tsx`
- `src/components/SetupPanel/SetupPanel.scss`
- `src/components/EngineControls/EngineControls.tsx`
- `src/components/EngineControls/EngineControls.scss`

**Deleted** (logic absorbed into new components):
- `src/components/SimulationControls/SimulationControls.tsx`
- `src/components/SimulationControls/SimulationControls.scss`
- `src/components/SimulationOptions/SimulationOptions.tsx`
- `src/components/SimulationOptions/SimulationOptions.scss`
- `src/components/TrackManagement/TrackManagement.tsx`
- `src/components/TrackManagement/TrackManagement.scss`

**Kept unchanged:** `src/components/DistanceInput/` — imported inside `SetupPanel`.

---

## Task 1: Reducer — `TrackDistanceOverride` type + new actions

**Files:**
- Modify: `src/store/simulationReducer.ts`
- Modify: `src/store/simulationReducer.test.ts`

- [ ] **Step 1: Write failing tests + update broken assertions**

Open `src/store/simulationReducer.test.ts`. Add these four new tests and update the two existing `toEqual` assertions that check track object shape (they now require `distanceOverride: null`).

```ts
// UPDATE in "add/remove track transitions are bounded and deterministic":
// change:
expect(withAddedTrack.tracks[2]).toEqual({ id: "track-3", objectId: "train" });
// to:
expect(withAddedTrack.tracks[2]).toEqual({ id: "track-3", objectId: "train", distanceOverride: null });

// UPDATE in "add track enforces lane limit and defaults unknown objects safely":
// change:
expect(fallbackTrackState.tracks[2]).toEqual({
  id: "track-3",
  objectId: "human-walking",
});
// to:
expect(fallbackTrackState.tracks[2]).toEqual({
  id: "track-3",
  objectId: "human-walking",
  distanceOverride: null,
});

// NEW tests — add at the end of the describe block:
test("SET_TRACK_DISTANCE stores override on a track", () => {
  const state = createInitialSimulationState();

  const next = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-1",
    amount: 500,
    unit: DistanceUnit.METERS,
  });

  expect(next.tracks[0].distanceOverride).toEqual({
    amount: 500,
    unit: DistanceUnit.METERS,
    value: 500,
  });
  expect(next.tracks[1].distanceOverride).toBeNull();
});

test("SET_TRACK_DISTANCE for unknown trackId is a no-op", () => {
  const state = createInitialSimulationState();

  const next = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-99",
    amount: 500,
    unit: DistanceUnit.METERS,
  });

  expect(next).toBe(state);
});

test("CLEAR_TRACK_DISTANCE nulls the override", () => {
  const state = createInitialSimulationState();

  const withOverride = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-1",
    amount: 500,
    unit: DistanceUnit.METERS,
  });

  const cleared = simulationReducer(withOverride, {
    type: SimulationActionType.CLEAR_TRACK_DISTANCE,
    trackId: "track-1",
  });

  expect(cleared.tracks[0].distanceOverride).toBeNull();
});

test("ADD_TRACK with distanceOverride stores it on the new track", () => {
  const state = createInitialSimulationState();

  const next = simulationReducer(state, {
    type: SimulationActionType.ADD_TRACK,
    objectId: "train",
    distanceOverride: { amount: 2, unit: DistanceUnit.KILOMETERS, value: 2000 },
  });

  expect(next.tracks[2].distanceOverride).toEqual({
    amount: 2,
    unit: DistanceUnit.KILOMETERS,
    value: 2000,
  });
});

test("SET_DISTANCE does not affect per-track overrides", () => {
  const state = createInitialSimulationState();

  const withOverride = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-1",
    amount: 500,
    unit: DistanceUnit.METERS,
  });

  const afterGlobal = simulationReducer(withOverride, {
    type: SimulationActionType.SET_DISTANCE,
    value: 2,
    unit: DistanceUnit.KILOMETERS,
  });

  expect(afterGlobal.tracks[0].distanceOverride).toEqual({
    amount: 500,
    unit: DistanceUnit.METERS,
    value: 500,
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
bun test src/store/simulationReducer.test.ts
```

Expected: the two updated `toEqual` assertions fail (track missing `distanceOverride`), and the four new tests fail with "Unknown action type" or property-not-found errors.

- [ ] **Step 3: Implement changes to `simulationReducer.ts`**

Replace the file content with:

```ts
import { DEFAULT_SPEED_OBJECT_IDS, SPEED_OBJECTS_BY_ID } from "../data/speedObjects";
import type { SimulationSnapshot } from "../engine/simulationEngine";
import {
  distanceToMeters,
  metersToDistance,
  DistanceUnit,
} from "../utils/unitConversion";

const DEFAULT_MAX_TRACKS = 10;

type TrackId = `track-${number}`;

export type TrackDistanceOverride = {
  amount: number;
  unit: DistanceUnit;
  value: number; // canonical meters
};

export type SimulationTrack = {
  id: TrackId;
  objectId: string;
  distanceOverride: TrackDistanceOverride | null;
};

export type DistanceState = {
  amount: number;
  unit: DistanceUnit;
  value: number;
};

export type SimulationEngineState = {
  elapsedTimeSeconds: number;
  isRunning: boolean;
};

export type SimulationState = {
  tracks: SimulationTrack[];
  distance: DistanceState;
  engine: SimulationEngineState;
  maxTracks: number;
  pauseOnFinish: boolean;
};

export enum SimulationActionType {
  ENGINE_SYNC = "ENGINE_SYNC",
  SET_DISTANCE = "SET_DISTANCE",
  ADD_TRACK = "ADD_TRACK",
  REMOVE_TRACK = "REMOVE_TRACK",
  SET_TRACK_OBJECT = "SET_TRACK_OBJECT",
  SET_PAUSE_ON_FINISH = "SET_PAUSE_ON_FINISH",
  SET_TRACK_DISTANCE = "SET_TRACK_DISTANCE",
  CLEAR_TRACK_DISTANCE = "CLEAR_TRACK_DISTANCE",
}

export type SimulationAction =
  | { type: SimulationActionType.ENGINE_SYNC; snapshot: SimulationSnapshot }
  | { type: SimulationActionType.SET_DISTANCE; value: number; unit: DistanceUnit }
  | { type: SimulationActionType.ADD_TRACK; objectId?: string; distanceOverride?: TrackDistanceOverride }
  | { type: SimulationActionType.REMOVE_TRACK; trackId: string }
  | { type: SimulationActionType.SET_TRACK_OBJECT; trackId: string; objectId: string }
  | { type: SimulationActionType.SET_PAUSE_ON_FINISH; enabled: boolean }
  | { type: SimulationActionType.SET_TRACK_DISTANCE; trackId: string; amount: number; unit: DistanceUnit }
  | { type: SimulationActionType.CLEAR_TRACK_DISTANCE; trackId: string };

export const createInitialSimulationState = (): SimulationState => {
  return {
    tracks: [
      { id: "track-1", objectId: DEFAULT_SPEED_OBJECT_IDS.primary, distanceOverride: null },
      { id: "track-2", objectId: DEFAULT_SPEED_OBJECT_IDS.secondary, distanceOverride: null },
    ],
    distance: {
      amount: 1,
      unit: DistanceUnit.KILOMETERS,
      value: 1000,
    },
    engine: {
      elapsedTimeSeconds: 0,
      isRunning: false,
    },
    maxTracks: DEFAULT_MAX_TRACKS,
    pauseOnFinish: false,
  };
};

export const simulationReducer = (
  state: SimulationState,
  action: SimulationAction,
): SimulationState => {
  switch (action.type) {
    case SimulationActionType.ENGINE_SYNC: {
      const nextDistanceMeters = action.snapshot.trackLengthMeters;
      const isTrackLengthChanged = nextDistanceMeters !== state.distance.value;

      return {
        ...state,
        engine: {
          elapsedTimeSeconds: action.snapshot.elapsedTimeSeconds,
          isRunning: action.snapshot.isRunning,
        },
        distance: isTrackLengthChanged
          ? {
              ...state.distance,
              amount: metersToDistance(nextDistanceMeters, state.distance.unit),
              value: nextDistanceMeters,
            }
          : state.distance,
      };
    }
    case SimulationActionType.SET_DISTANCE: {
      return {
        ...state,
        distance: {
          amount: action.value,
          unit: action.unit,
          value: distanceToMeters(action.value, action.unit),
        },
      };
    }
    case SimulationActionType.ADD_TRACK: {
      if (state.tracks.length >= state.maxTracks) {
        return state;
      }

      const nextTrackId = toTrackId(getNextTrackNumber(state.tracks));
      const requestedObjectId = action.objectId ?? DEFAULT_SPEED_OBJECT_IDS.primary;
      const objectId = SPEED_OBJECTS_BY_ID.has(requestedObjectId)
        ? requestedObjectId
        : DEFAULT_SPEED_OBJECT_IDS.primary;

      return {
        ...state,
        tracks: [
          ...state.tracks,
          {
            id: nextTrackId,
            objectId,
            distanceOverride: action.distanceOverride ?? null,
          },
        ],
      };
    }
    case SimulationActionType.REMOVE_TRACK: {
      if (state.tracks.length <= 1) {
        return state;
      }

      const nextTracks = state.tracks.filter((track) => track.id !== action.trackId);

      if (nextTracks.length === state.tracks.length) {
        return state;
      }

      return { ...state, tracks: nextTracks };
    }
    case SimulationActionType.SET_TRACK_OBJECT: {
      if (!SPEED_OBJECTS_BY_ID.has(action.objectId)) {
        return state;
      }

      let changed = false;
      const nextTracks = state.tracks.map((track) => {
        if (track.id !== action.trackId) {
          return track;
        }

        changed = true;

        return { ...track, objectId: action.objectId };
      });

      if (!changed) {
        return state;
      }

      return { ...state, tracks: nextTracks };
    }
    case SimulationActionType.SET_PAUSE_ON_FINISH: {
      return { ...state, pauseOnFinish: action.enabled };
    }
    case SimulationActionType.SET_TRACK_DISTANCE: {
      let changed = false;
      const nextTracks = state.tracks.map((track) => {
        if (track.id !== action.trackId) {
          return track;
        }

        changed = true;

        return {
          ...track,
          distanceOverride: {
            amount: action.amount,
            unit: action.unit,
            value: distanceToMeters(action.amount, action.unit),
          },
        };
      });

      if (!changed) {
        return state;
      }

      return { ...state, tracks: nextTracks };
    }
    case SimulationActionType.CLEAR_TRACK_DISTANCE: {
      let changed = false;
      const nextTracks = state.tracks.map((track) => {
        if (track.id !== action.trackId || track.distanceOverride === null) {
          return track;
        }

        changed = true;

        return { ...track, distanceOverride: null };
      });

      if (!changed) {
        return state;
      }

      return { ...state, tracks: nextTracks };
    }
    default: {
      return state;
    }
  }
};

const getNextTrackNumber = (tracks: SimulationTrack[]): number => {
  let maxTrackNumber = 0;

  for (const track of tracks) {
    const trackNumber = Number.parseInt(track.id.replace("track-", ""), 10);

    if (Number.isFinite(trackNumber) && trackNumber > maxTrackNumber) {
      maxTrackNumber = trackNumber;
    }
  }

  return maxTrackNumber + 1;
};

const toTrackId = (value: number): TrackId => `track-${value}`;
```

- [ ] **Step 4: Run tests and verify all pass**

```bash
bun test src/store/simulationReducer.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/store/simulationReducer.ts src/store/simulationReducer.test.ts
git commit -m "feat: add TrackDistanceOverride type and SET/CLEAR_TRACK_DISTANCE actions"
```

---

## Task 2: Selectors — per-track effective length

**Files:**
- Modify: `src/store/simulationSelectors.ts`
- Modify: `src/store/simulationSelectors.test.ts`

- [ ] **Step 1: Write failing tests + update broken references**

Open `src/store/simulationSelectors.test.ts`. Add these new tests. Also update any reference to `trackLengthMeters` → `effectiveTrackLengthMeters` (there are none currently in that file, but check to be sure).

```ts
// NEW tests — add at the end of the describe block:
test("effectiveTrackLengthMeters uses distanceOverride.value when set", () => {
  const state = createInitialSimulationState();

  const withOverride = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-1",
    amount: 500,
    unit: DistanceUnit.METERS,
  });

  const visual = selectTrackVisualState(withOverride, "track-1");

  expect(visual?.effectiveTrackLengthMeters).toBe(500);
});

test("effectiveTrackLengthMeters falls back to global when distanceOverride is null", () => {
  const state = createInitialSimulationState(); // global 1000 m

  const visual = selectTrackVisualState(state, "track-1");

  expect(visual?.effectiveTrackLengthMeters).toBe(1000);
});

test("isFinished uses effectiveTrackLengthMeters not global", () => {
  // airplane: 900 km/h = 250 m/s. Override to 250 m → finishes at 1 s.
  // Global is 1000 m so without override it would NOT be finished at 2 s.
  const state = createInitialSimulationState();
  const withAirplane = simulationReducer(state, {
    type: SimulationActionType.ADD_TRACK,
    objectId: "airplane",
  });
  const withOverride = simulationReducer(withAirplane, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-3",
    amount: 250,
    unit: DistanceUnit.METERS,
  });
  const synced = simulationReducer(withOverride, {
    type: SimulationActionType.ENGINE_SYNC,
    snapshot: { elapsedTimeSeconds: 2, isRunning: true, trackLengthMeters: 1000 },
  });

  const visual = selectTrackVisualState(synced, "track-3");

  expect(visual?.isFinished).toBe(true);
  expect(visual?.clampedDistanceMeters).toBe(250);
  expect(visual?.remainingDistanceMeters).toBe(0);
});

test("distanceOverride is exposed on TrackVisualState", () => {
  const state = createInitialSimulationState();

  const withOverride = simulationReducer(state, {
    type: SimulationActionType.SET_TRACK_DISTANCE,
    trackId: "track-1",
    amount: 2,
    unit: DistanceUnit.KILOMETERS,
  });

  const visual = selectTrackVisualState(withOverride, "track-1");

  expect(visual?.distanceOverride).toEqual({
    amount: 2,
    unit: DistanceUnit.KILOMETERS,
    value: 2000,
  });
  expect(selectTrackVisualState(state, "track-2")?.distanceOverride).toBeNull();
});
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
bun test src/store/simulationSelectors.test.ts
```

Expected: the four new tests fail with property-not-found errors.

- [ ] **Step 3: Implement changes to `simulationSelectors.ts`**

Replace the file content with:

```ts
import { SPEED_OBJECTS_BY_ID } from "../data/speedObjects";
import type { SpeedObjectCategory } from "../data/speedObjects";
import {
  speedToMetersPerSecond,
  SpeedLengthUnit,
  SpeedTimeUnit,
} from "../utils/unitConversion";
import { deriveTrackPosition } from "../utils/trackPosition";
import type {
  SimulationState,
  SimulationTrack,
  TrackDistanceOverride,
} from "./simulationReducer";

export type TrackDerivedState = {
  trackId: string;
  objectId: string;
  objectName: string;
  objectCategory: SpeedObjectCategory;
  speedValue: number;
  speedTimeUnit: SpeedTimeUnit;
  speedLengthUnit: SpeedLengthUnit;
  speedMetersPerSecond: number;
  elapsedTimeSeconds: number;
  distanceMeters: number;
  effectiveTrackLengthMeters: number;
  distanceOverride: TrackDistanceOverride | null;
};

export type TrackVisualState = TrackDerivedState & {
  clampedDistanceMeters: number;
  remainingDistanceMeters: number;
  progressRatio: number;
  progressPercent: number;
  isFinished: boolean;
};

export const selectTrackById = (
  state: SimulationState,
  trackId: string,
): SimulationTrack | undefined => state.tracks.find((track) => track.id === trackId);

export const selectTrackDerivedState = (
  state: SimulationState,
  trackId: string,
): TrackDerivedState | undefined => {
  const track = selectTrackById(state, trackId);

  if (!track) {
    return undefined;
  }

  const speedObject = SPEED_OBJECTS_BY_ID.get(track.objectId);

  if (!speedObject) {
    return undefined;
  }

  const effectiveTrackLengthMeters =
    track.distanceOverride?.value ?? state.distance.value;

  const speedValue = speedObject.averageSpeedKmh;
  const speedTimeUnit = SpeedTimeUnit.HOURS;
  const speedLengthUnit = SpeedLengthUnit.KILOMETERS;
  const speedMs = speedToMetersPerSecond(speedValue, speedLengthUnit, speedTimeUnit);
  const naturalDistanceMeters = speedMs * state.engine.elapsedTimeSeconds;
  const isFinished = naturalDistanceMeters >= effectiveTrackLengthMeters;
  const effectiveElapsedSeconds = isFinished
    ? effectiveTrackLengthMeters / speedMs
    : state.engine.elapsedTimeSeconds;
  const distanceMeters = isFinished ? effectiveTrackLengthMeters : naturalDistanceMeters;

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
    effectiveTrackLengthMeters,
    distanceOverride: track.distanceOverride,
  };
};

export const selectTrackVisualState = (
  state: SimulationState,
  trackId: string,
): TrackVisualState | undefined => {
  const trackDerivedState = selectTrackDerivedState(state, trackId);

  if (!trackDerivedState) {
    return undefined;
  }

  const trackPosition = deriveTrackPosition(
    trackDerivedState.distanceMeters,
    trackDerivedState.effectiveTrackLengthMeters,
  );

  return {
    ...trackDerivedState,
    clampedDistanceMeters: trackPosition.clampedDistanceMeters,
    remainingDistanceMeters: trackPosition.remainingDistanceMeters,
    progressRatio: trackPosition.progressRatio,
    progressPercent: trackPosition.progressPercent,
    isFinished: trackPosition.isFinished,
  };
};

export const selectTrackVisualStates = (state: SimulationState): TrackVisualState[] => {
  return state.tracks
    .map((track) => selectTrackVisualState(state, track.id))
    .filter((track): track is TrackVisualState => track !== undefined);
};
```

- [ ] **Step 4: Fix the `trackLengthMeters` reference in `Track.tsx`** (compile guard)

Open `src/components/Track/Track.tsx`. Find this line:

```tsx
<span>{formatMeters(track.trackLengthMeters)}</span>
```

Change it to:

```tsx
<span>{formatMeters(track.effectiveTrackLengthMeters)}</span>
```

- [ ] **Step 5: Run all tests and typecheck**

```bash
bun run build
```

Expected: all tests pass, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/store/simulationSelectors.ts src/store/simulationSelectors.test.ts src/components/Track/Track.tsx
git commit -m "feat: compute effectiveTrackLengthMeters per track in selectors"
```

---

## Task 3: Store — new action helpers

**Files:**
- Modify: `src/store/simulationStore.ts`
- Modify: `src/store/simulationStore.test.ts`

- [ ] **Step 1: Write failing tests + update broken assertion**

Open `src/store/simulationStore.test.ts`.

Update the existing `addTrack` assertion in `"track management actions mutate reducer state through zustand actions"`:

```ts
// change:
expect(store.getState().simulationState.tracks[2]).toEqual({
  id: "track-3",
  objectId: "train",
});
// to:
expect(store.getState().simulationState.tracks[2]).toEqual({
  id: "track-3",
  objectId: "train",
  distanceOverride: null,
});
```

Add new tests at the end of the describe block:

```ts
test("setTrackDistance stores override and ignores invalid values", () => {
  const store = createSimulationStore({
    timeController: { start: () => {}, stop: () => {} },
  });

  store.getState().setTrackDistance("track-1", 500, DistanceUnit.METERS);
  expect(store.getState().simulationState.tracks[0].distanceOverride).toEqual({
    amount: 500,
    unit: DistanceUnit.METERS,
    value: 500,
  });

  // Invalid values are no-ops
  const before = store.getState().simulationState;
  store.getState().setTrackDistance("track-1", 0, DistanceUnit.METERS);
  store.getState().setTrackDistance("track-1", -1, DistanceUnit.METERS);
  store.getState().setTrackDistance("track-1", Number.NaN, DistanceUnit.METERS);
  expect(store.getState().simulationState).toBe(before);
});

test("clearTrackDistance removes the override", () => {
  const store = createSimulationStore({
    timeController: { start: () => {}, stop: () => {} },
  });

  store.getState().setTrackDistance("track-1", 500, DistanceUnit.METERS);
  store.getState().clearTrackDistance("track-1");
  expect(store.getState().simulationState.tracks[0].distanceOverride).toBeNull();
});

test("addTrack with distanceOverride passes it to the reducer", () => {
  const store = createSimulationStore({
    timeController: { start: () => {}, stop: () => {} },
  });

  store.getState().addTrack("train", {
    amount: 2,
    unit: DistanceUnit.KILOMETERS,
    value: 2000,
  });

  expect(store.getState().simulationState.tracks[2].distanceOverride).toEqual({
    amount: 2,
    unit: DistanceUnit.KILOMETERS,
    value: 2000,
  });
});
```

- [ ] **Step 2: Run tests to confirm failures**

```bash
bun test src/store/simulationStore.test.ts
```

Expected: the updated assertion fails (missing `distanceOverride`), and the three new tests fail with "is not a function".

- [ ] **Step 3: Implement changes to `simulationStore.ts`**

Add `setTrackDistance` and `clearTrackDistance` to the `SimulationStoreState` type and the store implementation. Update `addTrack` signature. The full diff is:

In the type block, after `setPauseOnFinish`:

```ts
// Add to SimulationStoreState type:
setTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
clearTrackDistance: (trackId: string) => void;
// Update addTrack signature:
addTrack: (objectId?: string, distanceOverride?: TrackDistanceOverride) => void;
```

Add the import for `TrackDistanceOverride` at the top:

```ts
import {
  createInitialSimulationState,
  simulationReducer,
  SimulationActionType,
  type SimulationAction,
  type SimulationState,
  type TrackDistanceOverride,
} from "./simulationReducer";
```

In the store implementation, update `addTrack` and add two new helpers:

```ts
addTrack: (objectId, distanceOverride) => {
  get().dispatch({ type: SimulationActionType.ADD_TRACK, objectId, distanceOverride });
},
setTrackDistance: (trackId, amount, unit) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }

  get().dispatch({ type: SimulationActionType.SET_TRACK_DISTANCE, trackId, amount, unit });
},
clearTrackDistance: (trackId) => {
  get().dispatch({ type: SimulationActionType.CLEAR_TRACK_DISTANCE, trackId });
},
```

- [ ] **Step 4: Run all tests**

```bash
bun run build
```

Expected: all tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/store/simulationStore.ts src/store/simulationStore.test.ts
git commit -m "feat: add setTrackDistance and clearTrackDistance store helpers"
```

---

## Task 4: `SetupPanel` component

**Files:**
- Create: `src/components/SetupPanel/SetupPanel.tsx`
- Create: `src/components/SetupPanel/SetupPanel.scss`

- [ ] **Step 1: Create `SetupPanel.tsx`**

```tsx
import React, { useState } from "react";

import { SPEED_OBJECTS } from "../../data/speedObjects";
import { useSimulationStore } from "../../store/simulationStore";
import { DistanceUnit, distanceToMeters } from "../../utils/unitConversion";
import { DistanceInput } from "../DistanceInput/DistanceInput";
import { Button, ButtonVariant } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import "./SetupPanel.scss";

export const SetupPanel = () => {
  const trackCount = useSimulationStore((state) => state.simulationState.tracks.length);
  const maxTracks = useSimulationStore((state) => state.simulationState.maxTracks);
  const addTrack = useSimulationStore((state) => state.addTrack);

  const [selectedObjectId, setSelectedObjectId] = useState(SPEED_OBJECTS[0].id);
  const [overrideDraftAmount, setOverrideDraftAmount] = useState("");
  const [overrideDraftUnit, setOverrideDraftUnit] = useState<DistanceUnit>(DistanceUnit.METERS);

  const canAddTrack = trackCount < maxTracks;
  const parsedOverride = Number.parseFloat(overrideDraftAmount.trim());
  const hasValidOverride =
    overrideDraftAmount.trim().length > 0 &&
    Number.isFinite(parsedOverride) &&
    parsedOverride > 0;

  const handleAddTrack = () => {
    const distanceOverride = hasValidOverride
      ? {
          amount: parsedOverride,
          unit: overrideDraftUnit,
          value: distanceToMeters(parsedOverride, overrideDraftUnit),
        }
      : undefined;

    addTrack(selectedObjectId, distanceOverride);
  };

  return (
    <aside className="setup-panel" aria-label="Setup">
      <div className="setup-panel__brand">
        <p className="setup-panel__eyebrow">SpeedPlane</p>
        <h1 className="setup-panel__title">Lane comparison</h1>
      </div>

      <DistanceInput />

      <section className="setup-panel__add-lane" aria-label="Add lane">
        <p className="setup-panel__section-title">Add lane</p>

        <div className="setup-panel__field">
          <label className="setup-panel__label" htmlFor="setup-object-select">
            Object
          </label>
          <Select
            id="setup-object-select"
            value={selectedObjectId}
            onChange={(e) => setSelectedObjectId(e.target.value)}
            data-testid="setup-object-select"
          >
            {SPEED_OBJECTS.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="setup-panel__field">
          <label className="setup-panel__label" htmlFor="setup-override-amount">
            Custom distance <span className="setup-panel__optional">(optional)</span>
          </label>
          <div className="setup-panel__override-inputs">
            <Input
              id="setup-override-amount"
              type="number"
              inputMode="decimal"
              min="0.001"
              step="1"
              placeholder="Same as global"
              value={overrideDraftAmount}
              onChange={(e) => setOverrideDraftAmount(e.target.value)}
              data-testid="setup-override-amount"
            />
            <Select
              value={overrideDraftUnit}
              onChange={(e) => setOverrideDraftUnit(e.target.value as DistanceUnit)}
              data-testid="setup-override-unit"
            >
              <option value={DistanceUnit.METERS}>m</option>
              <option value={DistanceUnit.KILOMETERS}>km</option>
            </Select>
          </div>
        </div>

        <Button
          variant={ButtonVariant.PRIMARY}
          onClick={handleAddTrack}
          disabled={!canAddTrack}
          aria-disabled={!canAddTrack}
          data-testid="add-track-button"
        >
          + Add lane
        </Button>
      </section>

      <p className="setup-panel__lane-count" data-testid="track-count">
        Lanes: <span>{trackCount}</span> / {maxTracks}
      </p>
    </aside>
  );
};
```

- [ ] **Step 2: Create `SetupPanel.scss`**

```scss
@use "../../styles/variables" as v;

.setup-panel {
  width: 260px;
  min-width: 260px;
  background: rgba(v.$color-ink-800, 0.9);
  border-right: 1px solid rgba(v.$color-line, 0.7);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
  overflow-y: auto;
}

.setup-panel__brand {
  margin-bottom: 0.25rem;
}

.setup-panel__eyebrow {
  margin: 0;
  color: v.$color-accent-cool;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.setup-panel__title {
  margin: 0.2rem 0 0;
  font-family: v.$font-display;
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.setup-panel__section-title {
  margin: 0 0 0.65rem;
  color: v.$color-text-muted;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.setup-panel__add-lane {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.setup-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.setup-panel__label {
  color: v.$color-text-muted;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.setup-panel__optional {
  color: v.$color-text-muted;
  font-weight: 400;
  font-size: 0.7rem;
  text-transform: none;
  letter-spacing: 0;
}

.setup-panel__override-inputs {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
}

.setup-panel__lane-count {
  margin: auto 0 0;
  color: v.$color-text-muted;
  font-size: 0.8rem;

  span {
    color: v.$color-text;
    font-weight: 600;
  }
}
```

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/SetupPanel/
git commit -m "feat: add SetupPanel component with object selector and optional per-lane distance"
```

---

## Task 5: `EngineControls` component

**Files:**
- Create: `src/components/EngineControls/EngineControls.tsx`
- Create: `src/components/EngineControls/EngineControls.scss`

- [ ] **Step 1: Create `EngineControls.tsx`**

```tsx
import React from "react";

import { useSimulationStore } from "../../store/simulationStore";
import { Button, ButtonVariant } from "../ui/button";
import "./EngineControls.scss";

export const EngineControls = () => {
  const isRunning = useSimulationStore(
    (state) => state.simulationState.engine.isRunning,
  );
  const elapsedTimeSeconds = useSimulationStore(
    (state) => state.simulationState.engine.elapsedTimeSeconds,
  );
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const startSimulation = useSimulationStore((state) => state.startSimulation);
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation);
  const resetSimulation = useSimulationStore((state) => state.resetSimulation);
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);

  const canStart = !isRunning;
  const canPause = isRunning;
  const canReset = isRunning || elapsedTimeSeconds > 0;
  const statusLabel = isRunning
    ? "Running"
    : elapsedTimeSeconds > 0
      ? "Paused"
      : "Idle";

  return (
    <header className="engine-controls" aria-label="Engine controls">
      <p className="engine-controls__status">
        {statusLabel} — <span>{elapsedTimeSeconds.toFixed(2)}s</span>
      </p>
      <div className="engine-controls__actions">
        <Button
          variant={ButtonVariant.PRIMARY}
          onClick={startSimulation}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          Start
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={pauseSimulation}
          disabled={!canPause}
          aria-disabled={!canPause}
        >
          Pause
        </Button>
        <Button
          variant={ButtonVariant.DANGER}
          onClick={resetSimulation}
          disabled={!canReset}
          aria-disabled={!canReset}
        >
          Reset
        </Button>
      </div>
      <label className="engine-controls__option">
        <input
          type="checkbox"
          checked={pauseOnFinish}
          onChange={(e) => setPauseOnFinish(e.target.checked)}
        />
        Pause when each track finishes
      </label>
    </header>
  );
};
```

- [ ] **Step 2: Create `EngineControls.scss`**

```scss
@use "../../styles/variables" as v;

.engine-controls {
  align-items: center;
  background: rgba(v.$color-ink-800, 0.85);
  border-bottom: 1px solid rgba(v.$color-line, 0.7);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
  padding: 0.65rem 1rem;
}

.engine-controls__status {
  margin: 0;
  color: v.$color-text-muted;
  font-size: 0.8rem;
  min-width: 8rem;

  span {
    color: v.$color-text;
    font-weight: 600;
  }
}

.engine-controls__actions {
  display: flex;
  gap: 0.5rem;
}

.engine-controls__option {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: v.$color-text-muted;
  font-size: 0.8rem;
  cursor: pointer;
  margin-left: auto;

  input[type="checkbox"] {
    accent-color: v.$color-accent-cool;
    cursor: pointer;
  }
}
```

- [ ] **Step 3: Run typecheck**

```bash
bun run typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/EngineControls/
git commit -m "feat: add EngineControls component (absorbs SimulationControls + SimulationOptions)"
```

---

## Task 6: `Track` card — inline distance override

**Files:**
- Modify: `src/components/Track/Track.tsx`
- Modify: `src/components/Track/Track.scss`
- Modify: `src/components/TrackList/TrackList.tsx`

- [ ] **Step 1: Update `TrackList.tsx` to pass new props through**

Replace the file content with:

```tsx
import React from "react";

import type { SpeedObject } from "../../data/speedObjects";
import type { TrackVisualState } from "../../store/simulationSelectors";
import { DistanceUnit } from "../../utils/unitConversion";
import { Track } from "../Track/Track";
import "./TrackList.scss";

type TrackListProps = {
  tracks: TrackVisualState[];
  speedObjects: ReadonlyArray<SpeedObject>;
  canRemoveTrack: boolean;
  isRunning: boolean;
  onTrackObjectChange: (trackId: string, objectId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
};

export const TrackList = ({
  tracks,
  speedObjects,
  canRemoveTrack,
  isRunning,
  onTrackObjectChange,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
}: TrackListProps) => {
  if (tracks.length === 0) {
    return (
      <section className="track-list track-list--empty" aria-live="polite">
        No lanes available.
      </section>
    );
  }

  return (
    <section className="track-list" aria-label="Speed comparison lanes">
      {tracks.map((track) => (
        <Track
          key={track.trackId}
          track={track}
          speedObjects={speedObjects}
          canRemoveTrack={canRemoveTrack}
          isRunning={isRunning}
          onTrackObjectChange={onTrackObjectChange}
          onRemoveTrack={onRemoveTrack}
          onSetTrackDistance={onSetTrackDistance}
          onClearTrackDistance={onClearTrackDistance}
        />
      ))}
    </section>
  );
};
```

- [ ] **Step 2: Update `Track.tsx` to add inline distance override form**

Replace the file content with:

```tsx
import { type CSSProperties, useEffect, useState } from "react";
import React from "react";

import { Badge } from "../ui/badge";
import { Button, ButtonVariant } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { SpeedObject } from "../../data/speedObjects";
import type { TrackVisualState } from "../../store/simulationSelectors";
import {
  DistanceUnit,
  SpeedLengthUnit,
  SpeedTimeUnit,
  metersToDistance,
} from "../../utils/unitConversion";
import "./Track.scss";

type TrackProps = {
  track: TrackVisualState;
  speedObjects: ReadonlyArray<SpeedObject>;
  canRemoveTrack: boolean;
  isRunning: boolean;
  onTrackObjectChange: (trackId: string, objectId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
};

export const Track = ({
  track,
  speedObjects,
  canRemoveTrack,
  isRunning,
  onTrackObjectChange,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
}: TrackProps) => {
  const runnerStyle = {
    "--progress-ratio": String(track.progressRatio),
  } as CSSProperties;
  const selectId = `track-object-select-${track.trackId}`;
  const distanceInputId = `track-distance-${track.trackId}`;

  const [draftAmount, setDraftAmount] = useState(() =>
    formatDistanceAmount(
      track.distanceOverride
        ? track.distanceOverride.amount
        : metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
    ),
  );
  const [draftUnit, setDraftUnit] = useState<DistanceUnit>(
    track.distanceOverride?.unit ?? DistanceUnit.METERS,
  );

  useEffect(() => {
    if (track.distanceOverride) {
      setDraftAmount(formatDistanceAmount(track.distanceOverride.amount));
      setDraftUnit(track.distanceOverride.unit);
    } else {
      setDraftAmount(
        formatDistanceAmount(
          metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
        ),
      );
      setDraftUnit(DistanceUnit.METERS);
    }
  }, [track.distanceOverride, track.effectiveTrackLengthMeters]);

  const handleDistanceBlur = () => {
    const parsed = Number.parseFloat(draftAmount.trim());

    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Revert to current effective value
      if (track.distanceOverride) {
        setDraftAmount(formatDistanceAmount(track.distanceOverride.amount));
        setDraftUnit(track.distanceOverride.unit);
      } else {
        setDraftAmount(
          formatDistanceAmount(
            metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
          ),
        );
      }

      return;
    }

    onSetTrackDistance(track.trackId, parsed, draftUnit);
  };

  return (
    <Card className="track-card" data-testid={`track-card-${track.trackId}`}>
      <CardHeader className="track-card__header">
        <div>
          <CardTitle>{track.objectName}</CardTitle>
          <CardDescription>{formatSpeed(track)}</CardDescription>
        </div>
        <div className="track-card__header-right">
          {track.isFinished ? <Badge>Finished</Badge> : null}
          <Button
            variant={ButtonVariant.DANGER}
            disabled={!canRemoveTrack}
            onClick={() => onRemoveTrack(track.trackId)}
            aria-label={`Remove ${track.trackId}`}
            data-testid={`remove-track-${track.trackId}`}
          >
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="track-card__controls">
          <label htmlFor={selectId}>Object</label>
          <Select
            id={selectId}
            value={track.objectId}
            onChange={(event) => onTrackObjectChange(track.trackId, event.target.value)}
            data-testid={selectId}
          >
            {speedObjects.map((speedObject) => (
              <option key={speedObject.id} value={speedObject.id}>
                {speedObject.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="track-card__controls track-card__distance-override">
          <label htmlFor={distanceInputId}>
            Distance
            {track.distanceOverride ? (
              <button
                type="button"
                className="track-card__use-global"
                onClick={() => onClearTrackDistance(track.trackId)}
                disabled={isRunning}
                aria-label="Use global track length"
                data-testid={`clear-distance-${track.trackId}`}
              >
                Use global
              </button>
            ) : (
              <span className="track-card__global-badge">global</span>
            )}
          </label>
          <div className="track-card__distance-inputs">
            <Input
              id={distanceInputId}
              type="number"
              inputMode="decimal"
              min="0.001"
              step="1"
              value={draftAmount}
              disabled={isRunning}
              onChange={(e) => setDraftAmount(e.target.value)}
              onBlur={handleDistanceBlur}
              data-testid={`track-distance-amount-${track.trackId}`}
            />
            <Select
              value={draftUnit}
              disabled={isRunning}
              onChange={(e) => {
                setDraftUnit(e.target.value as DistanceUnit);
              }}
              data-testid={`track-distance-unit-${track.trackId}`}
            >
              <option value={DistanceUnit.METERS}>m</option>
              <option value={DistanceUnit.KILOMETERS}>km</option>
            </Select>
          </div>
        </div>

        <div className="track-card__lane-scale" aria-hidden="true">
          <span>0 m</span>
          <span>{formatMeters(track.effectiveTrackLengthMeters)}</span>
        </div>
        <div
          className="track-card__lane"
          aria-label={`${track.objectName} lane`}
          data-progress={track.progressRatio}
        >
          <div className="track-card__start" aria-hidden="true" />
          <div
            className="track-card__runner"
            style={runnerStyle}
            aria-hidden="true"
          >
            <span>{toRunnerCode(track.objectName)}</span>
          </div>
          <div
            className="track-card__runner-value"
            style={runnerStyle}
            aria-hidden="true"
          >
            {formatMeters(track.clampedDistanceMeters)}
          </div>
          <div className="track-card__finish" aria-hidden="true" />
        </div>

        <dl className="track-card__metrics">
          <div>
            <dt>Travelled</dt>
            <dd>{formatMeters(track.clampedDistanceMeters)}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{formatMeters(track.remainingDistanceMeters)}</dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd>{track.elapsedTimeSeconds.toFixed(2)}s</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

const formatSpeed = (track: TrackVisualState): string => {
  const lengthUnit =
    track.speedLengthUnit === SpeedLengthUnit.KILOMETERS ? "km" : "m";
  const timeUnit = track.speedTimeUnit === SpeedTimeUnit.HOURS ? "h" : "s";

  return `${track.speedValue} ${lengthUnit}/${timeUnit} (${track.speedMetersPerSecond.toFixed(2)} m/s)`;
};

const formatMeters = (value: number): string => {
  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);

  return `${rounded} m`;
};

const formatDistanceAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(6).replace(/\.?0+$/, "");
};

const toRunnerCode = (objectName: string): string => {
  const words = objectName
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "??";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
};
```

- [ ] **Step 3: Add new styles to `Track.scss`**

Add these rules at the end of `src/components/Track/Track.scss` (before the closing `@media` block — insert before line 139):

```scss
.track-card__distance-override {
  margin-bottom: 0.55rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
}

.track-card__distance-inputs {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
}

.track-card__use-global {
  background: none;
  border: none;
  color: v.$color-accent-cool;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:disabled {
    color: v.$color-text-muted;
    cursor: not-allowed;
    text-decoration: none;
  }
}

.track-card__global-badge {
  color: v.$color-text-muted;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

- [ ] **Step 4: Run typecheck and tests**

```bash
bun run build
```

Expected: all tests pass, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Track/Track.tsx src/components/Track/Track.scss src/components/TrackList/TrackList.tsx
git commit -m "feat: add inline distance override to Track card"
```

---

## Task 7: App shell — two-column layout + delete absorbed components

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.scss`
- Delete: `src/components/SimulationControls/SimulationControls.tsx`
- Delete: `src/components/SimulationControls/SimulationControls.scss`
- Delete: `src/components/SimulationOptions/SimulationOptions.tsx`
- Delete: `src/components/SimulationOptions/SimulationOptions.scss`
- Delete: `src/components/TrackManagement/TrackManagement.tsx`
- Delete: `src/components/TrackManagement/TrackManagement.scss`

- [ ] **Step 1: Replace `App.tsx`**

```tsx
import React, { useMemo } from "react";

import { EngineControls } from "../components/EngineControls/EngineControls";
import { SetupPanel } from "../components/SetupPanel/SetupPanel";
import { TrackList } from "../components/TrackList/TrackList";
import { SPEED_OBJECTS } from "../data/speedObjects";
import { selectTrackVisualStates } from "../store/simulationSelectors";
import { useSimulationStore } from "../store/simulationStore";
import "./App.scss";

export const App = () => {
  const simulationState = useSimulationStore((state) => state.simulationState);
  const trackVisualStates = useMemo(
    () => selectTrackVisualStates(simulationState),
    [simulationState],
  );
  const isRunning = useSimulationStore(
    (state) => state.simulationState.engine.isRunning,
  );
  const trackCount = useSimulationStore(
    (state) => state.simulationState.tracks.length,
  );
  const removeTrack = useSimulationStore((state) => state.removeTrack);
  const setTrackObject = useSimulationStore((state) => state.setTrackObject);
  const setTrackDistance = useSimulationStore((state) => state.setTrackDistance);
  const clearTrackDistance = useSimulationStore((state) => state.clearTrackDistance);

  return (
    <main className="app-shell">
      <SetupPanel />
      <div className="app-shell__main">
        <EngineControls />
        <TrackList
          tracks={trackVisualStates}
          speedObjects={SPEED_OBJECTS}
          canRemoveTrack={trackCount > 1}
          isRunning={isRunning}
          onTrackObjectChange={setTrackObject}
          onRemoveTrack={removeTrack}
          onSetTrackDistance={setTrackDistance}
          onClearTrackDistance={clearTrackDistance}
        />
      </div>
    </main>
  );
};
```

- [ ] **Step 2: Replace `App.scss`**

```scss
@use "../styles/variables" as v;

.app-shell {
  display: flex;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  border-left: 1px solid rgba(v.$color-line, 0.5);
  border-right: 1px solid rgba(v.$color-line, 0.5);
  background: rgba(v.$color-ink-900, 0.95);
}

.app-shell__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

@media (max-width: v.$tablet-breakpoint) {
  .app-shell {
    flex-direction: column;
    max-width: 100%;
  }

  .app-shell__main {
    overflow: visible;
  }
}
```

- [ ] **Step 3: Delete absorbed component files**

```bash
rm src/components/SimulationControls/SimulationControls.tsx
rm src/components/SimulationControls/SimulationControls.scss
rm src/components/SimulationOptions/SimulationOptions.tsx
rm src/components/SimulationOptions/SimulationOptions.scss
rm src/components/TrackManagement/TrackManagement.tsx
rm src/components/TrackManagement/TrackManagement.scss
```

- [ ] **Step 4: Run full build**

```bash
bun run build
```

Expected: all tests pass, no type errors. If typecheck fails on deleted component directories still having an index file, delete those too.

- [ ] **Step 5: Run E2E tests**

```bash
bun run e2e:bundle && bun run e2e:serve
```

Then in a separate terminal:

```bash
npx playwright test
```

Expected: all E2E tests pass. The `data-testid="track-count"` and `data-testid="add-track-button"` are now on `SetupPanel` — Playwright will find them in the new location.

- [ ] **Step 6: Commit**

```bash
git add src/app/App.tsx src/app/App.scss src/components/SetupPanel/ src/components/EngineControls/
git add -u src/components/SimulationControls/ src/components/SimulationOptions/ src/components/TrackManagement/
git commit -m "feat: two-column app shell with SetupPanel and EngineControls"
```

---

## Self-Review

**Spec coverage:**
- ✅ Left panel fixed 260px with global distance, object selector, optional distance override, add button, lane count
- ✅ Top bar (EngineControls) with play/pause/reset + elapsed + pause-on-finish
- ✅ Lanes take remaining width
- ✅ Per-lane distance override with amount + unit (`TrackDistanceOverride`)
- ✅ "Use global" clears override; global changes cascade to unoverridden tracks via selector
- ✅ Inline override disabled while running
- ✅ Track metrics (travelled, remaining, elapsed) preserved on lane card
- ✅ `SET_TRACK_DISTANCE` / `CLEAR_TRACK_DISTANCE` actions + store helpers
- ✅ `ADD_TRACK` with optional `distanceOverride`

**Placeholder scan:** None found.

**Type consistency:**
- `TrackDistanceOverride` defined in Task 1, imported in Tasks 2, 3, 4, 6 — consistent.
- `effectiveTrackLengthMeters` added to `TrackDerivedState` in Task 2, used in Task 6 — consistent.
- `setTrackDistance` / `clearTrackDistance` defined in Task 3, called in Task 6 — signatures match.
- `distanceOverride: null` in `createInitialSimulationState` — consistent with `SimulationTrack` type.
- `onSetTrackDistance` / `onClearTrackDistance` added to `TrackList` in Task 6, wired in Task 7 — consistent.
