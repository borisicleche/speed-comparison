import React, { useMemo } from "react";

import { EngineControls } from "../components/EngineControls/EngineControls";
import { SetupPanel } from "../components/SetupPanel/SetupPanel";
import { TrackList } from "../components/TrackList/TrackList";
import { selectTrackVisualStates } from "../store/simulationSelectors";
import { useSimulationStore } from "../store/simulationStore";
import "./App.scss";

export const App = () => {
  const simulationState = useSimulationStore((state) => state.simulationState);
  const trackVisualStates = useMemo(
    () => selectTrackVisualStates(simulationState),
    [simulationState],
  );
  const isLocked = simulationState.engine.elapsedTimeSeconds > 0;
  const trackCount = useSimulationStore(
    (state) => state.simulationState.tracks.length,
  );
  const removeTrack = useSimulationStore((state) => state.removeTrack);
  const setTrackDistance = useSimulationStore((state) => state.setTrackDistance);
  const clearTrackDistance = useSimulationStore((state) => state.clearTrackDistance);
  const setTrackObject = useSimulationStore((state) => state.setTrackObject);

  return (
    <main className="app-shell">
      <SetupPanel />
      <div className="app-shell__main">
        <EngineControls />
        <TrackList
          tracks={trackVisualStates}
          canRemoveTrack={trackCount > 1}
          isLocked={isLocked}
          onRemoveTrack={removeTrack}
          onSetTrackDistance={setTrackDistance}
          onClearTrackDistance={clearTrackDistance}
          onSetTrackObject={setTrackObject}
        />
      </div>
    </main>
  );
};
