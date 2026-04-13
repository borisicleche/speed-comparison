import { describe, expect, test } from "bun:test";

import {
  SimulationActionType,
  createInitialSimulationState,
  simulationReducer,
  type SimulationState,
} from "./simulationReducer";
import {
  selectTrackById,
  selectTrackDerivedState,
  selectTrackVisualState,
  selectTrackVisualStates,
} from "./simulationSelectors";
import { DistanceUnit, SpeedLengthUnit, SpeedTimeUnit } from "../utils/unitConversion";

describe("simulationSelectors", () => {
  test("selectTrackById returns lane by id", () => {
    const state = createInitialSimulationState();

    expect(selectTrackById(state, "track-1")?.objectId).toBe("human-walking");
    expect(selectTrackById(state, "missing")).toBeUndefined();
  });

  test("derived distance comes from speed value + time/length units", () => {
    const initialState = createInitialSimulationState();

    const updatedState: SimulationState = simulationReducer(initialState, {
      type: SimulationActionType.ENGINE_SYNC,
      snapshot: {
        elapsedTimeSeconds: 10,
        isRunning: true,
        trackLengthMeters: 1000,
      },
    });

    const derived = selectTrackDerivedState(updatedState, "track-1");

    expect(derived).toBeDefined();
    expect(derived?.speedValue).toBe(5);
    expect(derived?.speedTimeUnit).toBe(SpeedTimeUnit.HOURS);
    expect(derived?.speedLengthUnit).toBe(SpeedLengthUnit.KILOMETERS);
    expect(derived?.distanceMeters).toBeCloseTo((5 / 3.6) * 10, 12);
  });

  test("all tracks read from one shared elapsed-time snapshot", () => {
    const initialState = createInitialSimulationState();
    const withThirdTrack = simulationReducer(initialState, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "plane-boeing-737",
    });

    const syncedState = simulationReducer(withThirdTrack, {
      type: SimulationActionType.ENGINE_SYNC,
      snapshot: {
        elapsedTimeSeconds: 4,
        isRunning: true,
        trackLengthMeters: 1000,
      },
    });

    const trackOne = selectTrackDerivedState(syncedState, "track-1");
    const trackThree = selectTrackDerivedState(syncedState, "track-3");

    expect(trackOne?.elapsedTimeSeconds).toBe(4);
    expect(trackThree?.elapsedTimeSeconds).toBe(4);
    expect(trackThree!.distanceMeters).toBeGreaterThan(trackOne!.distanceMeters);
  });

  test("derived selector returns undefined for invalid track/object", () => {
    const initialState = createInitialSimulationState();

    const invalidObjectState: SimulationState = {
      ...initialState,
      tracks: [{ id: "track-1", objectId: "does-not-exist", distanceOverride: null }],
    };

    expect(selectTrackDerivedState(initialState, "missing")).toBeUndefined();
    expect(selectTrackDerivedState(invalidObjectState, "track-1")).toBeUndefined();
  });

  test("visual selector clamps progress at finish line", () => {
    const initialState = createInitialSimulationState();
    const withFastTrack = simulationReducer(initialState, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "plane-boeing-737",
    });

    const syncedState = simulationReducer(withFastTrack, {
      type: SimulationActionType.ENGINE_SYNC,
      snapshot: {
        elapsedTimeSeconds: 9,
        isRunning: true,
        trackLengthMeters: 1000,
      },
    });

    const visualTrack = selectTrackVisualState(syncedState, "track-3");

    expect(visualTrack).toBeDefined();
    expect(visualTrack?.clampedDistanceMeters).toBe(1000);
    expect(visualTrack?.remainingDistanceMeters).toBe(0);
    expect(visualTrack?.progressPercent).toBe(100);
    expect(visualTrack?.isFinished).toBe(true);
  });

  test("finished track freezes elapsed time at exact finish time", () => {
    const initialState = createInitialSimulationState();
    // plane-boeing-737: 842 km/h ≈ 233.89 m/s, track 1000 m → finishes at 1000 / (842/3.6) ≈ 4.276 s
    const withAirplane = simulationReducer(initialState, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "plane-boeing-737",
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
    expect(derived?.elapsedTimeSeconds).toBeCloseTo(1000 / (842 / 3.6), 10);
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
      objectId: "plane-boeing-737",
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

  test("visual selector scales proportionally across all lanes", () => {
    const initialState = createInitialSimulationState();
    const syncedState = simulationReducer(initialState, {
      type: SimulationActionType.ENGINE_SYNC,
      snapshot: {
        elapsedTimeSeconds: 6,
        isRunning: true,
        trackLengthMeters: 1000,
      },
    });

    const visualTracks = selectTrackVisualStates(syncedState);

    expect(visualTracks).toHaveLength(2);
    expect(visualTracks[0].progressPercent).toBeCloseTo(((5 / 3.6) * 6 * 100) / 1000, 12);
    expect(visualTracks[1].progressPercent).toBeCloseTo(((50 / 3.6) * 6 * 100) / 1000, 12);
    expect(visualTracks[1].progressPercent).toBeGreaterThan(visualTracks[0].progressPercent);
  });

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
    // plane-boeing-737: 842 km/h ≈ 233.89 m/s. Override to 250 m → finishes at ~1.07 s.
    // Global is 1000 m so without override it would NOT be finished at 2 s.
    const state = createInitialSimulationState();
    const withAirplane = simulationReducer(state, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "plane-boeing-737",
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
});
