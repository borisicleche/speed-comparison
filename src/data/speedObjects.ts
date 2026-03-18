export enum SpeedObjectCategory {
  HUMAN = "human",
  VEHICLE = "vehicle",
  ANIMAL = "animal",
  FICTIONAL = "fictional",
}

export const SPEED_OBJECT_CATEGORIES: ReadonlyArray<SpeedObjectCategory> = Object.values(
  SpeedObjectCategory,
);

export type SpeedObject = {
  id: string;
  name: string;
  category: SpeedObjectCategory;
  averageSpeedKmh: number;
};

export const SPEED_OBJECTS: ReadonlyArray<SpeedObject> = [
  {
    id: "human-walking",
    name: "Human (walking)",
    category: SpeedObjectCategory.HUMAN,
    averageSpeedKmh: 5,
  },
  {
    id: "human-running",
    name: "Human (running)",
    category: SpeedObjectCategory.HUMAN,
    averageSpeedKmh: 15,
  },
  {
    id: "car-city-average",
    name: "Car (city average)",
    category: SpeedObjectCategory.VEHICLE,
    averageSpeedKmh: 50,
  },
  {
    id: "train",
    name: "Train",
    category: SpeedObjectCategory.VEHICLE,
    averageSpeedKmh: 120,
  },
  {
    id: "airplane",
    name: "Airplane",
    category: SpeedObjectCategory.VEHICLE,
    averageSpeedKmh: 900,
  },
  {
    id: "cheetah",
    name: "Cheetah",
    category: SpeedObjectCategory.ANIMAL,
    averageSpeedKmh: 100,
  },
];

export const SPEED_OBJECTS_BY_ID = new Map(
  SPEED_OBJECTS.map((speedObject) => [speedObject.id, speedObject]),
);

export const DEFAULT_SPEED_OBJECT_IDS = {
  primary: "human-walking",
  secondary: "car-city-average",
} as const;

export const getSpeedObjectById = (id: string): SpeedObject | undefined =>
  SPEED_OBJECTS_BY_ID.get(id);
