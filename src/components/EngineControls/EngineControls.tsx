import React from "react";

import { useSimulationStore } from "../../store/simulationStore";
import { Button, ButtonVariant } from "../ui/button";
import "./EngineControls.scss";

export const EngineControls = () => {
  const isRunning = useSimulationStore(
    (state) => state.simulationState.engine.isRunning,
  );
  const elapsedTimeSeconds = useSimulationStore(
    (state) => state.simulationState.engine.elapsedTimeSeconds,
  );
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const startSimulation = useSimulationStore((state) => state.startSimulation);
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation);
  const resetSimulation = useSimulationStore((state) => state.resetSimulation);
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);

  const canStart = !isRunning;
  const canPause = isRunning;
  const canReset = isRunning || elapsedTimeSeconds > 0;
  const statusLabel = isRunning
    ? "Running"
    : elapsedTimeSeconds > 0
      ? "Paused"
      : "Idle";

  return (
    <header className="engine-controls" aria-label="Engine controls">
      <p className="engine-controls__status">
        {statusLabel} — <span>{elapsedTimeSeconds.toFixed(2)}s</span>
      </p>
      <div className="engine-controls__actions">
        <Button
          variant={ButtonVariant.PRIMARY}
          onClick={startSimulation}
          disabled={!canStart}
          aria-disabled={!canStart}
        >
          Start
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={pauseSimulation}
          disabled={!canPause}
          aria-disabled={!canPause}
        >
          Pause
        </Button>
        <Button
          variant={ButtonVariant.DANGER}
          onClick={resetSimulation}
          disabled={!canReset}
          aria-disabled={!canReset}
        >
          Reset
        </Button>
      </div>
      <label className="engine-controls__option">
        <input
          type="checkbox"
          checked={pauseOnFinish}
          onChange={(e) => setPauseOnFinish(e.target.checked)}
        />
        Pause when each track finishes
      </label>
    </header>
  );
};
