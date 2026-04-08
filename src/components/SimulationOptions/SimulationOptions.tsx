import React from "react";

import { useSimulationStore } from "../../store/simulationStore";
import "./SimulationOptions.scss";

export const SimulationOptions = () => {
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPauseOnFinish(e.target.checked);

  return (
    <section className="simulation-options" aria-label="Simulation options">
      <p className="simulation-options__title">Options</p>
      <div className="simulation-options__item">
        {/* TODO: replace with ui/Checkbox primitive once available */}
        <input
          id="pause-on-finish"
          type="checkbox"
          checked={pauseOnFinish}
          onChange={handleChange}
        />
        <label className="simulation-options__label" htmlFor="pause-on-finish">
          Pause when each track finishes
        </label>
      </div>
    </section>
  );
};
