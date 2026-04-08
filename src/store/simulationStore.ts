import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { SimulationEngine } from "../engine/simulationEngine";
import { TimeController } from "../engine/timeController";
import { distanceToMeters, type DistanceUnit } from "../utils/unitConversion";
import {
  createInitialSimulationState,
  simulationReducer,
  SimulationActionType,
  type SimulationAction,
  type SimulationState,
} from "./simulationReducer";
import { selectTrackVisualStates } from "./simulationSelectors";

type TimeControllerLike = Pick<TimeController, "start" | "stop">;

type SimulationStoreDependencies = {
  engine?: SimulationEngine;
  timeController?: TimeControllerLike;
};

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
  destroyStore: () => void;
};

export type SimulationStore = StoreApi<SimulationStoreState>;

const DISTANCE_CHANGE_EPSILON_METERS = 1e-9;

export const createSimulationStore = (
  dependencies: SimulationStoreDependencies = {},
): SimulationStore => {
  const engine = dependencies.engine ?? new SimulationEngine();
  const timeController = dependencies.timeController ?? createDefaultTimeController(engine);

  let unsubscribeEngine = () => {};

  const store = createStore<SimulationStoreState>((set, get) => ({
    simulationState: createInitialSimulationState(),
    dispatch: (action) => {
      set((current) => ({
        simulationState: simulationReducer(current.simulationState, action),
      }));
    },
    startSimulation: () => {
      const { isRunning } = get().simulationState.engine;

      if (isRunning) {
        return;
      }

      engine.start();
      timeController.start();
    },
    pauseSimulation: () => {
      const { isRunning } = get().simulationState.engine;

      if (!isRunning) {
        return;
      }

      engine.pause();
      timeController.stop();
    },
    resetSimulation: () => {
      const { elapsedTimeSeconds, isRunning } = get().simulationState.engine;

      if (!isRunning && elapsedTimeSeconds <= 0) {
        return;
      }

      engine.reset();
      timeController.stop();
    },
    setDistance: (value, unit) => {
      if (!Number.isFinite(value) || value <= 0) {
        return;
      }

      const nextDistanceMeters = distanceToMeters(value, unit);

      if (!Number.isFinite(nextDistanceMeters) || nextDistanceMeters <= 0) {
        return;
      }

      const currentDistanceMeters = get().simulationState.distance.value;
      get().dispatch({ type: SimulationActionType.SET_DISTANCE, value, unit });

      if (!hasDistanceChanged(currentDistanceMeters, nextDistanceMeters)) {
        return;
      }

      engine.setDistance(nextDistanceMeters);
      timeController.stop();
    },
    addTrack: (objectId) => {
      get().dispatch({ type: SimulationActionType.ADD_TRACK, objectId });
    },
    removeTrack: (trackId) => {
      get().dispatch({ type: SimulationActionType.REMOVE_TRACK, trackId });
    },
    setTrackObject: (trackId, objectId) => {
      get().dispatch({ type: SimulationActionType.SET_TRACK_OBJECT, trackId, objectId });
    },
    destroyStore: () => {
      unsubscribeEngine();
      timeController.stop();
    },
  }));

  unsubscribeEngine = engine.subscribe(() => {
    const snapshot = engine.getSnapshot();

    store.getState().dispatch({
      type: SimulationActionType.ENGINE_SYNC,
      snapshot,
    });

    if (snapshot.isRunning) {
      const tracks = selectTrackVisualStates(store.getState().simulationState);
      if (tracks.length > 0 && tracks.every((t) => t.isFinished)) {
        engine.pause();
        timeController.stop();
      }
    }
  });

  store.getState().dispatch({
    type: SimulationActionType.ENGINE_SYNC,
    snapshot: engine.getSnapshot(),
  });

  return store;
};

const createDefaultTimeController = (engine: SimulationEngine): TimeControllerLike => {
  const hasBrowserRaf =
    typeof globalThis.requestAnimationFrame === "function" &&
    typeof globalThis.cancelAnimationFrame === "function";

  if (!hasBrowserRaf) {
    return {
      start: () => {},
      stop: () => {},
    };
  }

  return new TimeController(
    engine,
    globalThis.requestAnimationFrame.bind(globalThis),
    globalThis.cancelAnimationFrame.bind(globalThis),
  );
};

const hasDistanceChanged = (
  currentDistanceMeters: number,
  nextDistanceMeters: number,
): boolean =>
  Math.abs(currentDistanceMeters - nextDistanceMeters) > DISTANCE_CHANGE_EPSILON_METERS;

const defaultSimulationStore = createSimulationStore();

export const useSimulationStore = <T,>(
  selector: (state: SimulationStoreState) => T,
): T => useStore(defaultSimulationStore, selector);

export const getSimulationStore = (): SimulationStore => defaultSimulationStore;
