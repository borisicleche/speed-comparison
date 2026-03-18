import { DEFAULT_SPEED_OBJECT_IDS, SPEED_OBJECTS_BY_ID } from "../data/speedObjects";
import type { SimulationSnapshot } from "../engine/simulationEngine";
import {
  distanceToMeters,
  metersToDistance,
  DistanceUnit,
} from "../utils/unitConversion";

const DEFAULT_MAX_TRACKS = 10;

type TrackId = `track-${number}`;

export type SimulationTrack = {
  id: TrackId;
  objectId: string;
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
};

export enum SimulationActionType {
  ENGINE_SYNC = "ENGINE_SYNC",
  SET_DISTANCE = "SET_DISTANCE",
  ADD_TRACK = "ADD_TRACK",
  REMOVE_TRACK = "REMOVE_TRACK",
  SET_TRACK_OBJECT = "SET_TRACK_OBJECT",
}

export type SimulationAction =
  | { type: SimulationActionType.ENGINE_SYNC; snapshot: SimulationSnapshot }
  | { type: SimulationActionType.SET_DISTANCE; value: number; unit: DistanceUnit }
  | { type: SimulationActionType.ADD_TRACK; objectId?: string }
  | { type: SimulationActionType.REMOVE_TRACK; trackId: string }
  | { type: SimulationActionType.SET_TRACK_OBJECT; trackId: string; objectId: string };

export const createInitialSimulationState = (): SimulationState => {
  return {
    tracks: [
      { id: "track-1", objectId: DEFAULT_SPEED_OBJECT_IDS.primary },
      { id: "track-2", objectId: DEFAULT_SPEED_OBJECT_IDS.secondary },
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
        tracks: [...state.tracks, { id: nextTrackId, objectId }],
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

      return {
        ...state,
        tracks: nextTracks,
      };
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

        return {
          ...track,
          objectId: action.objectId,
        };
      });

      if (!changed) {
        return state;
      }

      return {
        ...state,
        tracks: nextTracks,
      };
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
