import React, { useMemo } from "react";

import { Button, ButtonVariant } from "../ui/button";
import "./TrackManagement.scss";

type TrackManagementProps = {
  trackCount: number;
  maxTracks: number;
  onAddTrack: () => void;
};

export const TrackManagement = ({
  trackCount,
  maxTracks,
  onAddTrack,
}: TrackManagementProps) => {
  const canAddTrack = useMemo(() => trackCount < maxTracks, [maxTracks, trackCount]);

  return (
    <section className="track-management" aria-label="Track management controls">
      <p className="track-management__status" data-testid="track-count">
        Lanes: <span>{trackCount}</span> / {maxTracks}
      </p>
      <Button
        variant={ButtonVariant.PRIMARY}
        onClick={onAddTrack}
        disabled={!canAddTrack}
        aria-disabled={!canAddTrack}
        data-testid="add-track-button"
      >
        Add lane
      </Button>
    </section>
  );
};
