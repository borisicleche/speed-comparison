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
      objectId: "train",
    });

    expect(withAddedTrack.tracks[2]).toEqual({ id: "track-3", objectId: "train" });

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
    });

    const maxedState = {
      ...state,
      maxTracks: 2,
    };
    const unchangedState = simulationReducer(maxedState, {
      type: SimulationActionType.ADD_TRACK,
      objectId: "train",
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
      objectId: "cheetah",
    });

    expect(changedState.tracks[0].objectId).toBe("cheetah");
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
});
