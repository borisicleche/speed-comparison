import { SPEED_OBJECTS } from "./speedObjects";
import { DistanceUnit } from "../utils/unitConversion";

export type DistanceFixture = {
  value: number;
  unit: DistanceUnit;
};

export type FinishTimeFixture = {
  objectId: string;
  distance: DistanceFixture;
  expectedFinishSeconds: number;
};

// Deterministic baseline fixtures used by CH-001 unit tests.
export const FINISH_TIME_FIXTURES: ReadonlyArray<FinishTimeFixture> = [
  {
    objectId: "human-walking",
    distance: { value: 1, unit: DistanceUnit.KILOMETERS },
    expectedFinishSeconds: 720,
  },
  {
    objectId: "car-city-average",
    distance: { value: 1, unit: DistanceUnit.KILOMETERS },
    expectedFinishSeconds: 72,
  },
  {
    objectId: "airplane",
    distance: { value: 1, unit: DistanceUnit.KILOMETERS },
    expectedFinishSeconds: 4,
  },
];

export const SPEED_OBJECT_ID_SET = new Set(SPEED_OBJECTS.map((item) => item.id));
