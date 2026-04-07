import { SPEED_OBJECTS_BY_ID } from "../data/speedObjects";
import type { SpeedObjectCategory } from "../data/speedObjects";
import {
  speedToMetersPerSecond,
  SpeedLengthUnit,
  SpeedTimeUnit,
} from "../utils/unitConversion";
import { deriveTrackPosition } from "../utils/trackPosition";
import type { SimulationState, SimulationTrack } from "./simulationReducer";

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
};

export type TrackVisualState = TrackDerivedState & {
  trackLengthMeters: number;
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

  const speedValue = speedObject.averageSpeedKmh;
  const speedTimeUnit = SpeedTimeUnit.HOURS;
  const speedLengthUnit = SpeedLengthUnit.KILOMETERS;
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
    state.distance.value,
  );

  return {
    ...trackDerivedState,
    trackLengthMeters: state.distance.value,
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
