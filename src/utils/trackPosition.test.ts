import { describe, expect, test } from "bun:test";

import { deriveTrackPosition } from "./trackPosition";

describe("deriveTrackPosition", () => {
  test("clamps negative distance at zero", () => {
    const position = deriveTrackPosition(-120, 1000);

    expect(position).toEqual({
      clampedDistanceMeters: 0,
      remainingDistanceMeters: 1000,
      progressRatio: 0,
      progressPercent: 0,
      isFinished: false,
    });
  });

  test("clamps beyond finish line at track length", () => {
    const position = deriveTrackPosition(1400, 1000);

    expect(position).toEqual({
      clampedDistanceMeters: 1000,
      remainingDistanceMeters: 0,
      progressRatio: 1,
      progressPercent: 100,
      isFinished: true,
    });
  });

  test("keeps proportional progress for in-range distance", () => {
    const position = deriveTrackPosition(250, 1000);

    expect(position.clampedDistanceMeters).toBe(250);
    expect(position.remainingDistanceMeters).toBe(750);
    expect(position.progressRatio).toBeCloseTo(0.25, 12);
    expect(position.progressPercent).toBeCloseTo(25, 12);
    expect(position.isFinished).toBe(false);
  });

  test("returns deterministic safe values for non-positive track lengths", () => {
    const zeroLengthPosition = deriveTrackPosition(100, 0);
    const negativeLengthPosition = deriveTrackPosition(100, -500);

    expect(zeroLengthPosition).toEqual({
      clampedDistanceMeters: 0,
      remainingDistanceMeters: 0,
      progressRatio: 0,
      progressPercent: 0,
      isFinished: false,
    });

    expect(negativeLengthPosition).toEqual(zeroLengthPosition);
  });
});
