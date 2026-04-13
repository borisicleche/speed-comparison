import { describe, expect, test } from "bun:test";

import type { SimulationSnapshot } from "../engine/simulationEngine";
import { DistanceUnit } from "../utils/unitConversion";
import {
  SimulationActionType,
  createInitialSimulationState,
  simulationReducer,
} from "./simulationReducer";

describe("simulationReducer", () => {
  test("initial state includes default lanes and shared engine state", () => {
    const state = createInitialSimulationState();

    expect(state.tracks.map((track) => track.id)).toEqual(["track-1", "track-2"]);
    expect(state.engine).toEqual({ elapsedTimeSeconds: 0, isRunning: false });
    expect(state.distance).toEqual({
      amount: 1,
      unit: DistanceUnit.KILOMETERS,
      value: 1000,
    });
  });

  test("set distance converts to meters", () => {
    const state = createInitialSimulationState();

    const nextState = simulationReducer(state, {
      type: SimulationActionType.SET_DISTANCE,
      value: 250,
      unit: DistanceUnit.METERS,
    });

    expect(nextState.distance).toEqual({
      amount: 250,
      unit: DistanceUnit.METERS,
      value: 250,
    });
  });

  test("add/remove track transitions are bounded and deterministic", () => {
    const state = createInitialSimulationState();

    const withAddedTrack = simulationReducer(state, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "train-commuter",
    });

    expect(withAddedTrack.tracks[2]).toEqual({ id: "track-3", objectId: "train-commuter", distanceOverride: null });

    const withRemovedTrack = simulationReducer(withAddedTrack, {
      type: SimulationActionType.REMOVE_TRACK,
      trackId: "track-2",
    });

    expect(withRemovedTrack.tracks.map((track) => track.id)).toEqual([
      "track-1",
      "track-3",
    ]);

    const singleTrackState = {
      ...withRemovedTrack,
      tracks: [withRemovedTrack.tracks[0]],
    };

    const unchangedState = simulationReducer(singleTrackState, {
      type: SimulationActionType.REMOVE_TRACK,
      trackId: singleTrackState.tracks[0].id,
    });

    expect(unchangedState).toBe(singleTrackState);
  });

  test("add track enforces lane limit and defaults unknown objects safely", () => {
    const state = createInitialSimulationState();

    const fallbackTrackState = simulationReducer(state, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "missing-object",
    });

    expect(fallbackTrackState.tracks[2]).toEqual({
      id: "track-3",
      objectId: "human-walking",
      distanceOverride: null,
    });

    const maxedState = {
      ...state,
      maxTracks: 2,
    };
    const unchangedState = simulationReducer(maxedState, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "train-commuter",
    });

    expect(unchangedState).toBe(maxedState);
  });

  test("set track object rejects unknown object ids", () => {
    const state = createInitialSimulationState();

    const unchangedState = simulationReducer(state, {
      type: SimulationActionType.SET_TRACK_OBJECT,
      trackId: "track-1",
      objectId: "unknown-object",
    });

    expect(unchangedState).toBe(state);

    const changedState = simulationReducer(state, {
      type: SimulationActionType.SET_TRACK_OBJECT,
      trackId: "track-1",
      objectId: "animal-cheetah",
    });

    expect(changedState.tracks[0].objectId).toBe("animal-cheetah");
  });

  test("engine sync updates running state and elapsed time from shared clock", () => {
    const state = createInitialSimulationState();

    const snapshot: SimulationSnapshot = {
      elapsedTimeSeconds: 3.25,
      isRunning: true,
      trackLengthMeters: 500,
    };

    const nextState = simulationReducer(state, {
      type: SimulationActionType.ENGINE_SYNC,
      snapshot,
    });

    expect(nextState.engine).toEqual({ elapsedTimeSeconds: 3.25, isRunning: true });
    expect(nextState.distance.value).toBe(500);
    expect(nextState.distance.amount).toBe(0.5);
    expect(nextState.tracks).toEqual(state.tracks);
  });

  test("initial state has pauseOnFinish disabled", () => {
    const state = createInitialSimulationState();
    expect(state.pauseOnFinish).toBe(false);
  });

  test("SET_PAUSE_ON_FINISH toggles the flag", () => {
    const state = createInitialSimulationState();

    const enabled = simulationReducer(state, {
      type: SimulationActionType.SET_PAUSE_ON_FINISH,
      enabled: true,
    });
    expect(enabled.pauseOnFinish).toBe(true);

    const disabled = simulationReducer(enabled, {
      type: SimulationActionType.SET_PAUSE_ON_FINISH,
      enabled: false,
    });
    expect(disabled.pauseOnFinish).toBe(false);
  });

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
      objectId: "train-commuter",
      distanceOverride: { amount: 2, unit: DistanceUnit.KILOMETERS, value: 2000 },
    });

    expect(next.tracks[2].distanceOverride).toEqual({
      amount: 2,
      unit: DistanceUnit.KILOMETERS,
      value: 2000,
    });
  });

  test("CLEAR_TRACK_DISTANCE on a track with no override is a no-op", () => {
    const state = createInitialSimulationState();
    const next = simulationReducer(state, {
      type: SimulationActionType.CLEAR_TRACK_DISTANCE,
      trackId: "track-1",
    });
    expect(next).toBe(state);
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
});
