import { describe, expect, test } from "bun:test";

import { SimulationEngine } from "../engine/simulationEngine";
import { DistanceUnit } from "../utils/unitConversion";
import { selectTrackVisualStates } from "./simulationSelectors";
import { createSimulationStore } from "./simulationStore";

test("setPauseOnFinish updates simulationState flag", () => {
  const store = createSimulationStore({
    timeController: { start: () => {}, stop: () => {} },
  });

  expect(store.getState().simulationState.pauseOnFinish).toBe(false);

  store.getState().setPauseOnFinish(true);
  expect(store.getState().simulationState.pauseOnFinish).toBe(true);

  store.getState().setPauseOnFinish(false);
  expect(store.getState().simulationState.pauseOnFinish).toBe(false);
});

test("pause-on-finish auto-pauses when first track crosses finish line", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { start: 0, stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => { controllerCalls.start += 1; },
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  store.getState().setPauseOnFinish(true);
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // car finishes at ~72 s

  expect(store.getState().simulationState.engine.isRunning).toBe(false);
  expect(controllerCalls.stop).toBeGreaterThanOrEqual(1);
});

test("pause-on-finish auto-pauses again when second track finishes after resume", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => {},
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  store.getState().setPauseOnFinish(true);
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // first pause: car finishes

  const stopCountAfterFirst = controllerCalls.stop;

  // Resume
  store.getState().startSimulation();
  engine.advanceTo(73001); // re-establish baseline after resume
  engine.advanceTo(720001); // second pause: walking finishes

  expect(store.getState().simulationState.engine.isRunning).toBe(false);
  expect(controllerCalls.stop).toBeGreaterThan(stopCountAfterFirst);
});

test("pause-on-finish does not trigger on subsequent frames once track is already finished", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => {},
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  store.getState().setPauseOnFinish(true);
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // car finishes → pause

  const stopAfterFirstFinish = controllerCalls.stop;

  // If the engine were still running (it's not), advancing further should not add more stops.
  // Verify prevFinishedCount was updated so a re-trigger won't fire on resume+advance-past-same-point.
  store.getState().startSimulation();
  engine.advanceTo(73001);
  engine.advanceTo(74000); // still only car finished, walking has not yet

  // Should still be running (only car done, walking still in progress)
  expect(store.getState().simulationState.engine.isRunning).toBe(true);
  expect(controllerCalls.stop).toBe(stopAfterFirstFinish);
});

test("prevFinishedCount resets on resetSimulation so next run detects finishes correctly", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => {},
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  store.getState().setPauseOnFinish(true);

  // First run: advance until car finishes
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001);
  expect(store.getState().simulationState.engine.isRunning).toBe(false);

  // Reset, then second run
  store.getState().resetSimulation();
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // car finishes again in fresh run

  expect(store.getState().simulationState.engine.isRunning).toBe(false);
});

test("prevFinishedCount resets on setDistance so next run detects finishes correctly", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => {},
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  store.getState().setPauseOnFinish(true);

  // First run: advance until car finishes
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001);

  // Change distance (resets engine + prevFinishedCount)
  store.getState().setDistance(1, DistanceUnit.KILOMETERS);

  // Second run
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // car finishes again

  expect(store.getState().simulationState.engine.isRunning).toBe(false);
});

test("pause-on-finish does nothing when disabled", () => {
  const engine = new SimulationEngine();
  const controllerCalls = { stop: 0 };

  const store = createSimulationStore({
    engine,
    timeController: {
      start: () => {},
      stop: () => { controllerCalls.stop += 1; },
    },
  });

  // pauseOnFinish is false by default
  store.getState().startSimulation();
  engine.advanceTo(0);
  engine.advanceTo(73001); // car finishes

  // Should still be running (walking hasn't finished)
  expect(store.getState().simulationState.engine.isRunning).toBe(true);
});

describe("simulationStore (zustand)", () => {
  test("start/pause/reset synchronize shared engine snapshot", () => {
    const engine = new SimulationEngine();
    const controllerCalls = { start: 0, stop: 0 };

    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {
          controllerCalls.start += 1;
        },
        stop: () => {
          controllerCalls.stop += 1;
        },
      },
    });

    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(1200);

    expect(store.getState().simulationState.engine.isRunning).toBe(true);
    expect(store.getState().simulationState.engine.elapsedTimeSeconds).toBeCloseTo(1.2, 12);
    expect(controllerCalls.start).toBe(1);

    store.getState().pauseSimulation();
    engine.advanceTo(2000);

    expect(store.getState().simulationState.engine.isRunning).toBe(false);
    expect(store.getState().simulationState.engine.elapsedTimeSeconds).toBeCloseTo(1.2, 12);

    store.getState().resetSimulation();

    expect(store.getState().simulationState.engine).toEqual({
      elapsedTimeSeconds: 0,
      isRunning: false,
    });
  });

  test("setDistance updates reducer distance and engine distance together", () => {
    const engine = new SimulationEngine();

    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {},
        stop: () => {},
      },
    });

    store.getState().setDistance(2, DistanceUnit.KILOMETERS);

    expect(store.getState().simulationState.distance).toEqual({
      amount: 2,
      unit: DistanceUnit.KILOMETERS,
      value: 2000,
    });

    expect(engine.getSnapshot().trackLengthMeters).toBe(2000);
    expect(engine.getSnapshot().isRunning).toBe(false);
  });

  test("setDistance keeps engine running when meter distance is unchanged", () => {
    const engine = new SimulationEngine();
    const controllerCalls = { start: 0, stop: 0 };
    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {
          controllerCalls.start += 1;
        },
        stop: () => {
          controllerCalls.stop += 1;
        },
      },
    });

    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(1000);

    store.getState().setDistance(1000, DistanceUnit.METERS);

    expect(store.getState().simulationState.distance).toEqual({
      amount: 1000,
      unit: DistanceUnit.METERS,
      value: 1000,
    });
    expect(store.getState().simulationState.engine.isRunning).toBe(true);
    expect(store.getState().simulationState.engine.elapsedTimeSeconds).toBeCloseTo(1, 12);
    expect(engine.getSnapshot().isRunning).toBe(true);
    expect(controllerCalls.start).toBe(1);
    expect(controllerCalls.stop).toBe(0);
  });

  test("setDistance ignores invalid values", () => {
    const engine = new SimulationEngine();
    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {},
        stop: () => {},
      },
    });

    store.getState().setDistance(0, DistanceUnit.METERS);
    store.getState().setDistance(-1, DistanceUnit.KILOMETERS);
    store.getState().setDistance(Number.NaN, DistanceUnit.METERS);

    expect(store.getState().simulationState.distance).toEqual({
      amount: 1,
      unit: DistanceUnit.KILOMETERS,
      value: 1000,
    });
    expect(engine.getSnapshot().trackLengthMeters).toBe(1000);
  });

  test("track management actions mutate reducer state through zustand actions", () => {
    const store = createSimulationStore({
      timeController: {
        start: () => {},
        stop: () => {},
      },
    });

    store.getState().addTrack("train");
    expect(store.getState().simulationState.tracks[2]).toEqual({
      id: "track-3",
      objectId: "train",
    });

    store.getState().setTrackObject("track-1", "cheetah");
    expect(store.getState().simulationState.tracks[0].objectId).toBe("cheetah");

    store.getState().removeTrack("track-2");
    expect(store.getState().simulationState.tracks.map((track) => track.id)).toEqual([
      "track-1",
      "track-3",
    ]);
  });

  test("invalid control transitions do not trigger engine/time controller side effects", () => {
    const engine = new SimulationEngine();
    const controllerCalls = { start: 0, stop: 0 };

    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {
          controllerCalls.start += 1;
        },
        stop: () => {
          controllerCalls.stop += 1;
        },
      },
    });

    store.getState().pauseSimulation();
    store.getState().resetSimulation();
    expect(controllerCalls.stop).toBe(0);
    expect(engine.getSnapshot()).toEqual({
      elapsedTimeSeconds: 0,
      isRunning: false,
      trackLengthMeters: 1000,
    });

    store.getState().startSimulation();
    store.getState().startSimulation();
    expect(controllerCalls.start).toBe(1);
  });

  test("reset returns all lane visual positions to start", () => {
    const engine = new SimulationEngine();

    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => {},
        stop: () => {},
      },
    });

    store.getState().addTrack("train");
    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(3500);

    const beforeReset = selectTrackVisualStates(store.getState().simulationState);
    expect(beforeReset.every((track) => track.clampedDistanceMeters > 0)).toBe(true);

    store.getState().resetSimulation();

    const afterReset = selectTrackVisualStates(store.getState().simulationState);
    expect(afterReset.every((track) => track.clampedDistanceMeters === 0)).toBe(true);
    expect(afterReset.every((track) => track.progressPercent === 0)).toBe(true);
  });

  test("engine auto-stops when all tracks finish", () => {
    const engine = new SimulationEngine();
    const controllerCalls = { start: 0, stop: 0 };

    const store = createSimulationStore({
      engine,
      timeController: {
        start: () => { controllerCalls.start += 1; },
        stop: () => { controllerCalls.stop += 1; },
      },
    });

    // Default: human-walking (5 km/h) + car-city-average (50 km/h), 1000 m track.
    // Walking finishes at 720 s — advancing to 720.001 s means both are done.
    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(720001);

    expect(store.getState().simulationState.engine.isRunning).toBe(false);
    expect(controllerCalls.stop).toBeGreaterThanOrEqual(1);
  });

  test("engine keeps running when only some tracks finish", () => {
    const engine = new SimulationEngine();

    const store = createSimulationStore({
      engine,
      timeController: { start: () => {}, stop: () => {} },
    });

    // At 73 s: car-city-average has finished (~1013 m), walking has not (~101 m).
    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(73000);

    expect(store.getState().simulationState.engine.isRunning).toBe(true);
  });

  test("simulation can be reset and restarted after auto-stop", () => {
    const engine = new SimulationEngine();

    const store = createSimulationStore({
      engine,
      timeController: { start: () => {}, stop: () => {} },
    });

    store.getState().startSimulation();
    engine.advanceTo(0);
    engine.advanceTo(720001); // auto-stop

    expect(store.getState().simulationState.engine.isRunning).toBe(false);

    store.getState().resetSimulation();
    store.getState().startSimulation();

    expect(store.getState().simulationState.engine.isRunning).toBe(true);
  });

  test("default browser raf controller binds global context and advances elapsed time", () => {
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCancelRaf = globalThis.cancelAnimationFrame;
    type RafCallback = (timestampMs: number) => void;
    let queuedCallback: RafCallback | undefined;

    globalThis.requestAnimationFrame = function requestAnimationFrameMock(
      this: typeof globalThis,
      callback: RafCallback,
    ): number {
      if (this !== globalThis) {
        throw new TypeError("Illegal invocation");
      }

      queuedCallback = callback;

      return 1;
    };
    globalThis.cancelAnimationFrame = function cancelAnimationFrameMock(
      this: typeof globalThis,
      _handle: number,
    ): void {
      if (this !== globalThis) {
        throw new TypeError("Illegal invocation");
      }
    };

    try {
      const engine = new SimulationEngine();
      const store = createSimulationStore({ engine });

      store.getState().startSimulation();
      expect(store.getState().simulationState.engine.isRunning).toBe(true);
      expect(queuedCallback).toBeDefined();

      const onFrame = queuedCallback;

      if (!onFrame) {
        throw new Error("Expected requestAnimationFrame callback to be queued");
      }

      onFrame(0);
      onFrame(1000);

      expect(store.getState().simulationState.engine.elapsedTimeSeconds).toBeCloseTo(1, 12);

      store.getState().destroyStore();
    } finally {
      globalThis.requestAnimationFrame = originalRaf;
      globalThis.cancelAnimationFrame = originalCancelRaf;
    }
  });
});
