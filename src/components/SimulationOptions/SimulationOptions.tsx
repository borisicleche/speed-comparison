import React from "react";

import { useSimulationStore } from "../../store/simulationStore";
import "./SimulationOptions.scss";

export const SimulationOptions = () => {
  const pauseOnFinish = useSimulationStore(
    (state) => state.simulationState.pauseOnFinish,
  );
  const setPauseOnFinish = useSimulationStore((state) => state.setPauseOnFinish);

  return (
    <section className="simulation-options" aria-label="Simulation options">
      <p className="simulation-options__title">Options</p>
      <div className="simulation-options__item">
        <input
          id="pause-on-finish"
          type="checkbox"
          checked={pauseOnFinish}
          onChange={(e) => setPauseOnFinish(e.target.checked)}
        />
        <label className="simulation-options__label" htmlFor="pause-on-finish">
          Pause when each track finishes
        </label>
      </div>
    </section>
  );
};
