import React from "react";

import type { TrackVisualState } from "../../store/simulationSelectors";
import { DistanceUnit } from "../../utils/unitConversion";
import { Track } from "../Track/Track";
import "./TrackList.scss";

type TrackListProps = {
  tracks: TrackVisualState[];
  canRemoveTrack: boolean;
  isRunning: boolean;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
  onSetTrackObject: (trackId: string, objectId: string) => void;
};

export const TrackList = ({
  tracks,
  canRemoveTrack,
  isRunning,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
  onSetTrackObject,
}: TrackListProps) => {
  if (tracks.length === 0) {
    return (
      <section className="track-list track-list--empty" aria-live="polite">
        No lanes available.
      </section>
    );
  }

  return (
    <section className="track-list" aria-label="Speed comparison lanes">
      {tracks.map((track) => (
        <Track
          key={track.trackId}
          track={track}
          canRemoveTrack={canRemoveTrack}
          isRunning={isRunning}
          onRemoveTrack={onRemoveTrack}
          onSetTrackDistance={onSetTrackDistance}
          onClearTrackDistance={onClearTrackDistance}
          onSetTrackObject={onSetTrackObject}
        />
      ))}
    </section>
  );
};
