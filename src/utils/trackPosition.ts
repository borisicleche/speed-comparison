const PERCENT_MULTIPLIER = 100;

export type TrackPosition = {
  clampedDistanceMeters: number;
  remainingDistanceMeters: number;
  progressRatio: number;
  progressPercent: number;
  isFinished: boolean;
};

export const deriveTrackPosition = (
  distanceMeters: number,
  trackLengthMeters: number,
): TrackPosition => {
  const safeTrackLengthMeters = Math.max(0, trackLengthMeters);
  const clampedDistanceMeters = clamp(distanceMeters, 0, safeTrackLengthMeters);
  const progressRatio =
    safeTrackLengthMeters === 0 ? 0 : clampedDistanceMeters / safeTrackLengthMeters;
  const progressPercent = progressRatio * PERCENT_MULTIPLIER;
  const remainingDistanceMeters = safeTrackLengthMeters - clampedDistanceMeters;

  return {
    clampedDistanceMeters,
    remainingDistanceMeters,
    progressRatio,
    progressPercent,
    isFinished:
      safeTrackLengthMeters > 0 && clampedDistanceMeters >= safeTrackLengthMeters,
  };
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
};
