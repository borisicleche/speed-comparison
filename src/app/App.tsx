import React, { useMemo } from "react";

import { DistanceInput } from "../components/DistanceInput/DistanceInput";
import { SimulationControls } from "../components/SimulationControls/SimulationControls";
import { SimulationOptions } from "../components/SimulationOptions/SimulationOptions";
import { TrackList } from "../components/TrackList/TrackList";
import { TrackManagement } from "../components/TrackManagement/TrackManagement";
import { SPEED_OBJECTS } from "../data/speedObjects";
import { selectTrackVisualStates } from "../store/simulationSelectors";
import { useSimulationStore } from "../store/simulationStore";
import "./App.scss";

export const App = () => {
  const simulationState = useSimulationStore(
    (state) => state.simulationState,
  );
  const trackVisualStates = useMemo(
    () => selectTrackVisualStates(simulationState),
    [simulationState],
  );
  const distance = useSimulationStore((state) => state.simulationState.distance);
  const trackCount = useSimulationStore((state) => state.simulationState.tracks.length);
  const maxTracks = useSimulationStore((state) => state.simulationState.maxTracks);
  const addTrack = useSimulationStore((state) => state.addTrack);
  const removeTrack = useSimulationStore((state) => state.removeTrack);
  const setTrackObject = useSimulationStore((state) => state.setTrackObject);

  return (
    <main className="app-shell">
      <section className="app-shell__panel">
        <header className="app-shell__header">
          <p className="app-shell__eyebrow">SpeedPlane</p>
          <h1>Lane comparison baseline</h1>
          <p>
            Shared-clock simulation view ({formatDistance(distance.amount)} {distance.unit} /{" "}
            {distance.value.toFixed(0)} m track)
          </p>
        </header>

        <SimulationControls />
        <SimulationOptions />
        <DistanceInput />
        <TrackManagement
          trackCount={trackCount}
          maxTracks={maxTracks}
          onAddTrack={() => addTrack()}
        />
        <TrackList
          tracks={trackVisualStates}
          speedObjects={SPEED_OBJECTS}
          canRemoveTrack={trackCount > 1}
          onTrackObjectChange={setTrackObject}
          onRemoveTrack={removeTrack}
        />
      </section>
    </main>
  );
};

const formatDistance = (amount: number): string => {
  if (Number.isInteger(amount)) {
    return amount.toString();
  }

  const decimals = amount >= 1 ? 3 : 6;
  const fixed = amount.toFixed(decimals);

  return fixed.replace(/\.?0+$/, "");
};
