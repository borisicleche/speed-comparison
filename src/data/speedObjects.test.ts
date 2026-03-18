import { describe, expect, test } from "bun:test";

import {
  DEFAULT_SPEED_OBJECT_IDS,
  SPEED_OBJECTS,
  getSpeedObjectById,
} from "./speedObjects";
import { FINISH_TIME_FIXTURES, SPEED_OBJECT_ID_SET } from "./speedObjects.fixtures";
import { distanceToMeters, kmhToMs } from "../utils/unitConversion";

describe("speedObjects catalog", () => {
  test("contains unique ids", () => {
    expect(SPEED_OBJECT_ID_SET.size).toBe(SPEED_OBJECTS.length);
  });

  test("all items have positive average speed", () => {
    for (const speedObject of SPEED_OBJECTS) {
      expect(speedObject.averageSpeedKmh).toBeGreaterThan(0);
    }
  });

  test("default ids resolve to catalog entries", () => {
    expect(getSpeedObjectById(DEFAULT_SPEED_OBJECT_IDS.primary)).toBeDefined();
    expect(getSpeedObjectById(DEFAULT_SPEED_OBJECT_IDS.secondary)).toBeDefined();
  });

  test("deterministic finish-time fixtures stay stable", () => {
    for (const fixture of FINISH_TIME_FIXTURES) {
      const speedObject = getSpeedObjectById(fixture.objectId);

      expect(speedObject).toBeDefined();

      const distanceMeters = distanceToMeters(
        fixture.distance.value,
        fixture.distance.unit,
      );

      const computedFinishSeconds = distanceMeters / kmhToMs(speedObject!.averageSpeedKmh);

      expect(computedFinishSeconds).toBeCloseTo(fixture.expectedFinishSeconds, 8);
    }
  });
});
