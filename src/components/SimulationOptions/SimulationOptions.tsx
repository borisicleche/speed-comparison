import React from "react";

import { type SpeedMultiplier } from "../../utils/speedMultiplier";
import { useSimulationStore } from "../../store/simulationStore";
import { Select } from "../ui/select";
import "./SimulationOptions.scss";

export const SimulationOptions = () => {
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);
  const speedMultiplier = useSimulationStore(
    (state) => state.simulationState.engine.speedMultiplier,
  );
  const setSpeedMultiplier = useSimulationStore((state) => state.setSpeedMultiplier);

  const handlePauseChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPauseOnFinish(e.target.checked);

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    if (n === 1 || n === 2 || n === 3) setSpeedMultiplier(n);
  };

  return (
    <section className="simulation-options" aria-label="Simulation options">
      <p className="simulation-options__title">Options</p>
      <div className="simulation-options__item">
        <input
          id="pause-on-finish"
          type="checkbox"
          checked={pauseOnFinish}
          onChange={handlePauseChange}
        />
        <label className="simulation-options__label" htmlFor="pause-on-finish">
          Pause when each track finishes
        </label>
      </div>
      <div className="simulation-options__item">
        <label className="simulation-options__label" htmlFor="speed-multiplier">
          Speed
        </label>
        <Select
          id="speed-multiplier"
          value={speedMultiplier}
          onChange={handleMultiplierChange}
        >
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </Select>
      </div>
    </section>
  );
};
