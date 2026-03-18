import React from "react";

import type { SpeedObject } from "../../data/speedObjects";
import type { TrackVisualState } from "../../store/simulationSelectors";
import { Track } from "../Track/Track";
import "./TrackList.scss";

type TrackListProps = {
  tracks: TrackVisualState[];
  speedObjects: ReadonlyArray<SpeedObject>;
  canRemoveTrack: boolean;
  onTrackObjectChange: (trackId: string, objectId: string) => void;
  onRemoveTrack: (trackId: string) => void;
};

export const TrackList = ({
  tracks,
  speedObjects,
  canRemoveTrack,
  onTrackObjectChange,
  onRemoveTrack,
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
          speedObjects={speedObjects}
          canRemoveTrack={canRemoveTrack}
          onTrackObjectChange={onTrackObjectChange}
          onRemoveTrack={onRemoveTrack}
        />
      ))}
    </section>
  );
};
