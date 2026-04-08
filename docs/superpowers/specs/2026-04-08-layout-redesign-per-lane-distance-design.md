# SpeedPlane — Layout Redesign & Per-Lane Distance Design

**Date:** 2026-04-08  
**Status:** Approved

---

## Overview

Restructure the app shell from a single stacked column into a two-column layout: a fixed-width left setup panel and a right column with an engine controls bar on top and the scrollable lane list below. Each lane gains an optional per-track distance override with its own amount and unit, while lanes without an override follow the global distance setting.

---

## Layout

```
┌─────────────────────────────────────────────────────┐
│  app-shell (max-width: 1100px)                      │
│  ┌──────────┐  ┌───────────────────────────────┐   │
│  │  Setup   │  │  EngineControls (top bar)     │   │
│  │  Panel   │  ├───────────────────────────────┤   │
│  │  260px   │  │  TrackList (scrollable)       │   │
│  │  fixed   │  │                               │   │
│  └──────────┘  └───────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

The left panel is fixed at 260px wide. The right column takes remaining width. Both columns share the full viewport height inside `app-shell__panel`.

---

## Components

### `SetupPanel` (new)

Left column. Contains:
- Global track length input (relocate existing `DistanceInput`)
- Object selector dropdown (speed object to add)
- Optional distance override field: amount input + unit selector (`DistanceUnit`). Empty/cleared = follow global.
- "+ Add lane" button — calls `addTrack(objectId, distanceOverride?)`. If override field is empty, passes no override (lane follows global).
- Lane count indicator (e.g. `3 / 8`)

### `EngineControls` (new)

Top bar of the right column. Contains:
- Play / Pause / Reset buttons (logic from existing `SimulationControls`)
- Elapsed time display
- Pause-on-finish toggle (from existing `SimulationOptions`)

### `TrackList` (unchanged component)

Fills remaining right column height. Scrollable vertically.

### `Track` card (extended)

Gains:
- Inline distance override field: amount input + unit selector. Pre-populated with current effective value. Editing calls `setTrackDistance`. 
- "Use global" reset link — visible only when override is active. Calls `clearTrackDistance`.
- Metrics row (travelled, remaining, elapsed) — already present, no change needed.

### Deleted components

`SimulationControls`, `SimulationOptions`, `TrackManagement` — their logic is absorbed into `SetupPanel` and `EngineControls`. Old files are removed.

---

## State model

### `TrackDistanceOverride` (new type)

```ts
type TrackDistanceOverride = {
  amount: number;      // user-facing value
  unit: DistanceUnit;  // e.g. METERS, KILOMETERS, MILES
  value: number;       // canonical meters — derived via distanceToMeters(amount, unit)
};
```

### `Track` (extended)

```ts
type Track = {
  id: string;
  objectId: string;
  distanceOverride: TrackDistanceOverride | null; // null = follow global
};
```

### New action types

| Action | Payload | Effect |
|---|---|---|
| `SET_TRACK_DISTANCE` | `{ trackId, amount, unit }` | Reducer derives `value` via `distanceToMeters`; sets `distanceOverride` on the track |
| `CLEAR_TRACK_DISTANCE` | `{ trackId }` | Sets `distanceOverride: null` on the track |

Existing `SET_DISTANCE` (global) is unchanged.

---

## Selectors

`selectTrackVisualStates` computes `effectiveTrackLengthMeters` per track:

```ts
const effectiveTrackLengthMeters =
  track.distanceOverride?.value ?? globalDistanceMeters;
```

`TrackVisualState` gains:

```ts
effectiveTrackLengthMeters: number;
distanceOverride: TrackDistanceOverride | null;
```

All existing derived fields (`progressRatio`, `clampedDistanceMeters`, `remainingDistanceMeters`, `isFinished`) switch from global `trackLengthMeters` to `effectiveTrackLengthMeters`. No logic changes — only the source of the value changes.

---

## Store

Two new action helpers on `SimulationStoreState`:

```ts
setTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
clearTrackDistance: (trackId: string) => void;
```

`setTrackDistance` validates `amount > 0 && isFinite(amount)` before dispatching. No-ops on invalid input.

`addTrack` signature extended:

```ts
addTrack: (objectId?: string, distanceOverride?: TrackDistanceOverride) => void;
```

Passing no `distanceOverride` preserves existing behavior (lane follows global).

The engine (`SimulationEngine`, `TimeController`) is not modified.

---

## Edge cases

| Scenario | Behavior |
|---|---|
| Global distance changes | Tracks with `distanceOverride: null` update automatically via selector — no action needed |
| Override changed while simulation is running | The inline distance field on the lane card is **disabled** while the simulation is running. Override can only be edited when paused or stopped. |
| Override amount is invalid (0, negative, NaN) | `setTrackDistance` no-ops; field reverts to last valid value |
| User clears override mid-simulation | Track snaps to global distance immediately; finish line position may jump |
| Track unit differs from global unit | Lane card displays in its own unit; canonical meters used for all calculations |

---

## Testing

### Unit tests (colocated `.test.ts`, bun test)

- **Reducer:** `SET_TRACK_DISTANCE` sets override correctly; `CLEAR_TRACK_DISTANCE` nulls it; `SET_DISTANCE` does not affect tracks with an override.
- **Selector:** `effectiveTrackLengthMeters` uses override when set, falls back to global when null; `isFinished`, `progressRatio`, `remainingDistanceMeters` computed correctly with mixed per-track distances.
- **Store:** `setTrackDistance` validates and no-ops on invalid input; `addTrack` with `distanceOverride` sets it on the new track.

### E2E tests (Playwright, Chromium)

- Add lane from setup panel with pre-set distance override → lane card shows custom distance and correct progress.
- Edit distance inline on lane card → progress and metrics update correctly.
- Change global distance → lanes without override update; lane with override unchanged.
- Clear override via "Use global" link → lane snaps to global distance.

---

## Docs to update after implementation

Per `CLAUDE.md`:
1. Feature runbook in `docs/integration/features/`
2. Chunk/feature status in `docs/IMPLEMENTATION_PLAN.md`
3. Testing expectations in `docs/TESTING.md`
