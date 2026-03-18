import React, { useMemo } from "react";

import { Button, ButtonVariant } from "../ui/button";
import { useSimulationStore } from "../../store/simulationStore";
import "./SimulationControls.scss";

export const SimulationControls = () => {
  const isRunning = useSimulationStore(
    (state) => state.simulationState.engine.isRunning,
  );
  const elapsedTimeSeconds = useSimulationStore(
    (state) => state.simulationState.engine.elapsedTimeSeconds,
  );
  const startSimulation = useSimulationStore((state) => state.startSimulation);
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation);
  const resetSimulation = useSimulationStore((state) => state.resetSimulation);

  const controlsState = useMemo(() => {
    const canStart = !isRunning;
    const canPause = isRunning;
    const canReset = isRunning || elapsedTimeSeconds > 0;

    return {
      canStart,
      canPause,
      canReset,
      statusLabel: isRunning ? "Running" : elapsedTimeSeconds > 0 ? "Paused" : "Idle",
    };
  }, [elapsedTimeSeconds, isRunning]);

  return (
    <section className="simulation-controls" aria-label="Simulation controls">
      <p className="simulation-controls__status">
        Status: <span>{controlsState.statusLabel}</span>
      </p>
      <div className="simulation-controls__actions">
        <Button
          variant={ButtonVariant.PRIMARY}
          onClick={startSimulation}
          disabled={!controlsState.canStart}
          aria-disabled={!controlsState.canStart}
        >
          Start
        </Button>
        <Button
          variant={ButtonVariant.SECONDARY}
          onClick={pauseSimulation}
          disabled={!controlsState.canPause}
          aria-disabled={!controlsState.canPause}
        >
          Pause
        </Button>
        <Button
          variant={ButtonVariant.DANGER}
          onClick={resetSimulation}
          disabled={!controlsState.canReset}
          aria-disabled={!controlsState.canReset}
        >
          Reset
        </Button>
      </div>
    </section>
  );
};
