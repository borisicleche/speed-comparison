import { describe, expect, test } from "bun:test";

import { SimulationEngine } from "./simulationEngine";
import { TimeController, type RequestFrame, type CancelFrame } from "./timeController";

describe("TimeController", () => {
  test("drives engine with requestAnimationFrame timestamps", () => {
    const callbacks: FrameRequestCallback[] = [];
    const cancelled = new Set<number>();

    const requestFrame: RequestFrame = (callback) => {
      callbacks.push(callback);
      return callbacks.length;
    };

    const cancelFrame: CancelFrame = (handle) => {
      cancelled.add(handle);
    };

    const engine = new SimulationEngine();
    const controller = new TimeController(engine, requestFrame, cancelFrame);

    engine.start();
    controller.start();

    callbacks[0](0);
    callbacks[1](500);

    expect(engine.getElapsedTime()).toBeCloseTo(0.5, 12);

    controller.stop();

    expect(cancelled.has(3)).toBe(true);
  });
});
