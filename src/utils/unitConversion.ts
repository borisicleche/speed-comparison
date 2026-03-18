export enum DistanceUnit {
  METERS = "m",
  KILOMETERS = "km",
}

export enum SpeedTimeUnit {
  SECONDS = "seconds",
  MINUTES = "minutes",
  HOURS = "hours",
}

export enum SpeedLengthUnit {
  METERS = "meters",
  KILOMETERS = "kilometers",
}

const KMH_TO_MS_DIVISOR = 3.6;
const METERS_IN_KILOMETER = 1000;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;

export const kmhToMs = (speedKmh: number): number => speedKmh / KMH_TO_MS_DIVISOR;

export const distanceToMeters = (value: number, unit: DistanceUnit): number => {
  if (unit === DistanceUnit.KILOMETERS) {
    return value * METERS_IN_KILOMETER;
  }

  return value;
};

export const metersToDistance = (
  meters: number,
  unit: DistanceUnit,
): number => {
  if (unit === DistanceUnit.KILOMETERS) {
    return meters / METERS_IN_KILOMETER;
  }

  return meters;
};

export const speedMsToKmh = (speedMs: number): number => speedMs * KMH_TO_MS_DIVISOR;

export const speedToMetersPerSecond = (
  speedValue: number,
  speedLengthValue: SpeedLengthUnit,
  speedTimeValue: SpeedTimeUnit,
): number => {
  const lengthInMeters =
    speedLengthValue === SpeedLengthUnit.KILOMETERS
      ? speedValue * METERS_IN_KILOMETER
      : speedValue;

  const timeInSeconds =
    speedTimeValue === SpeedTimeUnit.HOURS
      ? SECONDS_IN_HOUR
      : speedTimeValue === SpeedTimeUnit.MINUTES
        ? SECONDS_IN_MINUTE
        : 1;

  return lengthInMeters / timeInSeconds;
};
