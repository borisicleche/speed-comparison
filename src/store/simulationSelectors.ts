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
  globalTrackLengthMeters: number;
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
    globalTrackLengthMeters: state.distance.value,
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
