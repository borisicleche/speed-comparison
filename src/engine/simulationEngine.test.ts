import { describe, expect, test } from "bun:test";

import { SimulationEngine } from "./simulationEngine";

describe("SimulationEngine", () => {
  test("starts, advances by delta, and pauses deterministically", () => {
    const engine = new SimulationEngine();

    engine.start();
    engine.advanceTo(0);
    engine.advanceTo(1000);

    expect(engine.getElapsedTime()).toBeCloseTo(1, 12);

    engine.pause();
    engine.advanceTo(2000);

    expect(engine.getElapsedTime()).toBeCloseTo(1, 12);
  });

  test("resume does not include paused wall-clock time", () => {
    const engine = new SimulationEngine();

    engine.start();
    engine.advanceTo(0);
    engine.advanceTo(1000);
    engine.pause();

    engine.start();
    engine.advanceTo(8000);
    engine.advanceTo(8500);

    expect(engine.getElapsedTime()).toBeCloseTo(1.5, 12);
  });

  test("reset clears elapsed time and running state", () => {
    const engine = new SimulationEngine();

    engine.start();
    engine.advanceTo(0);
    engine.advanceTo(2500);

    engine.reset();

    expect(engine.getSnapshot()).toEqual({
      elapsedTimeSeconds: 0,
      isRunning: false,
      trackLengthMeters: 1000,
    });
  });

  test("setDistance updates distance and resets simulation", () => {
    const engine = new SimulationEngine();

    engine.start();
    engine.advanceTo(0);
    engine.advanceTo(1300);

    engine.setDistance(5000);

    expect(engine.getSnapshot()).toEqual({
      elapsedTimeSeconds: 0,
      isRunning: false,
      trackLengthMeters: 5000,
    });
  });

  test("identical elapsed time with different frame chunking is deterministic", () => {
    const engineA = new SimulationEngine();
    const engineB = new SimulationEngine();

    engineA.start();
    engineA.advanceTo(0);
    engineA.advanceTo(250);
    engineA.advanceTo(500);
    engineA.advanceTo(750);
    engineA.advanceTo(1000);

    engineB.start();
    engineB.advanceTo(0);
    engineB.advanceTo(100);
    engineB.advanceTo(200);
    engineB.advanceTo(350);
    engineB.advanceTo(400);
    engineB.advanceTo(650);
    engineB.advanceTo(1000);

    expect(engineA.getElapsedTime()).toBeCloseTo(1, 12);
    expect(engineB.getElapsedTime()).toBeCloseTo(1, 12);
    expect(engineA.getElapsedTime()).toBeCloseTo(engineB.getElapsedTime(), 12);
  });

  test("subscribe notifies on state transitions and tick updates", () => {
    const engine = new SimulationEngine();
    let notifications = 0;

    const unsubscribe = engine.subscribe(() => {
      notifications += 1;
    });

    engine.start();
    engine.advanceTo(0);
    engine.advanceTo(16);
    engine.pause();

    unsubscribe();
    engine.reset();

    expect(notifications).toBe(3);
  });
});
