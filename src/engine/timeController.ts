import { SimulationEngine } from "./simulationEngine";

export type RequestFrame = (callback: FrameRequestCallback) => number;
export type CancelFrame = (handle: number) => void;

export class TimeController {
  private frameHandle: number | null = null;
  private isActive = false;

  constructor(
    private readonly engine: SimulationEngine,
    private readonly requestFrame: RequestFrame = requestAnimationFrame,
    private readonly cancelFrame: CancelFrame = cancelAnimationFrame,
  ) {}

  start(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;
    this.scheduleNextFrame();
  }

  stop(): void {
    this.isActive = false;

    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  private scheduleNextFrame(): void {
    if (!this.isActive) {
      return;
    }

    this.frameHandle = this.requestFrame((timeMs) => {
      this.engine.advanceTo(timeMs);
      this.scheduleNextFrame();
    });
  }
}
