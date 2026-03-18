import { describe, expect, test } from "bun:test";

import {
  DistanceUnit,
  SpeedLengthUnit,
  SpeedTimeUnit,
  distanceToMeters,
  kmhToMs,
  metersToDistance,
  speedToMetersPerSecond,
  speedMsToKmh,
} from "./unitConversion";

describe("unitConversion", () => {
  test("converts km/h to m/s with exact divisor", () => {
    expect(kmhToMs(36)).toBeCloseTo(10, 12);
    expect(kmhToMs(5)).toBeCloseTo(1.3888888889, 10);
  });

  test("converts m/s to km/h", () => {
    expect(speedMsToKmh(10)).toBeCloseTo(36, 12);
    expect(speedMsToKmh(1.3888888889)).toBeCloseTo(5, 8);
  });

  test("normalizes distance to meters", () => {
    expect(distanceToMeters(250, DistanceUnit.METERS)).toBe(250);
    expect(distanceToMeters(1, DistanceUnit.KILOMETERS)).toBe(1000);
    expect(distanceToMeters(1.5, DistanceUnit.KILOMETERS)).toBe(1500);
  });

  test("converts meters into requested unit", () => {
    expect(metersToDistance(250, DistanceUnit.METERS)).toBe(250);
    expect(metersToDistance(1500, DistanceUnit.KILOMETERS)).toBe(1.5);
  });

  test("round-trips distance conversions", () => {
    const meters = distanceToMeters(2.75, DistanceUnit.KILOMETERS);
    expect(metersToDistance(meters, DistanceUnit.KILOMETERS)).toBeCloseTo(2.75, 12);
  });

  test("converts generalized speed units to meters per second", () => {
    expect(
      speedToMetersPerSecond(5, SpeedLengthUnit.KILOMETERS, SpeedTimeUnit.HOURS),
    ).toBeCloseTo(
      5 / 3.6,
      12,
    );
    expect(
      speedToMetersPerSecond(300, SpeedLengthUnit.METERS, SpeedTimeUnit.MINUTES),
    ).toBeCloseTo(5, 12);
    expect(
      speedToMetersPerSecond(20, SpeedLengthUnit.METERS, SpeedTimeUnit.SECONDS),
    ).toBeCloseTo(20, 12);
  });
});
