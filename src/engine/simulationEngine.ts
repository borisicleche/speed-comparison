export type SimulationListener = () => void;

export type SimulationSnapshot = {
  elapsedTimeSeconds: number;
  isRunning: boolean;
  trackLengthMeters: number;
};

const DEFAULT_TRACK_LENGTH_METERS = 1000;

export class SimulationEngine {
  private elapsedTimeSeconds = 0;
  private isRunning = false;
  private trackLengthMeters = DEFAULT_TRACK_LENGTH_METERS;
  private lastFrameTimeMs: number | null = null;
  private listeners = new Set<SimulationListener>();

  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  pause(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  reset(): void {
    this.elapsedTimeSeconds = 0;
    this.isRunning = false;
    this.lastFrameTimeMs = null;
    this.notify();
  }

  setDistance(trackLengthMeters: number): void {
    this.trackLengthMeters = trackLengthMeters;

    // TAD invariant: distance changes reset active simulation state.
    this.elapsedTimeSeconds = 0;
    this.isRunning = false;
    this.lastFrameTimeMs = null;

    this.notify();
  }

  subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getElapsedTime(): number {
    return this.elapsedTimeSeconds;
  }

  getSnapshot(): SimulationSnapshot {
    return {
      elapsedTimeSeconds: this.elapsedTimeSeconds,
      isRunning: this.isRunning,
      trackLengthMeters: this.trackLengthMeters,
    };
  }

  advanceTo(frameTimeMs: number): void {
    if (!this.isRunning) {
      return;
    }

    if (this.lastFrameTimeMs === null) {
      this.lastFrameTimeMs = frameTimeMs;
      return;
    }

    const deltaMs = frameTimeMs - this.lastFrameTimeMs;

    if (deltaMs <= 0) {
      this.lastFrameTimeMs = frameTimeMs;
      return;
    }

    this.elapsedTimeSeconds += deltaMs / 1000;
    this.lastFrameTimeMs = frameTimeMs;
    this.notify();
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
