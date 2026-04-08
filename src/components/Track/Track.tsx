import { type CSSProperties } from "react";

import { Badge } from "../ui/badge";
import { Button, ButtonVariant } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Select } from "../ui/select";
import type { SpeedObject } from "../../data/speedObjects";
import type { TrackVisualState } from "../../store/simulationSelectors";
import { SpeedLengthUnit, SpeedTimeUnit } from "../../utils/unitConversion";
import "./Track.scss";

type TrackProps = {
  track: TrackVisualState;
  speedObjects: ReadonlyArray<SpeedObject>;
  canRemoveTrack: boolean;
  onTrackObjectChange: (trackId: string, objectId: string) => void;
  onRemoveTrack: (trackId: string) => void;
};

export const Track = ({
  track,
  speedObjects,
  canRemoveTrack,
  onTrackObjectChange,
  onRemoveTrack,
}: TrackProps) => {
  const runnerStyle = {
    "--progress-ratio": String(track.progressRatio),
  } as CSSProperties;
  const selectId = `track-object-select-${track.trackId}`;

  return (
    <Card className="track-card" data-testid={`track-card-${track.trackId}`}>
      <CardHeader className="track-card__header">
        <div>
          <CardTitle>{track.objectName}</CardTitle>
          <CardDescription>{formatSpeed(track)}</CardDescription>
        </div>
        <div className="track-card__header-right">
          {track.isFinished ? <Badge>Finished</Badge> : null}
          <Button
            variant={ButtonVariant.DANGER}
            disabled={!canRemoveTrack}
            onClick={() => onRemoveTrack(track.trackId)}
            aria-label={`Remove ${track.trackId}`}
            data-testid={`remove-track-${track.trackId}`}
          >
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="track-card__controls">
          <label htmlFor={selectId}>Object</label>
          <Select
            id={selectId}
            value={track.objectId}
            onChange={(event) => onTrackObjectChange(track.trackId, event.target.value)}
            data-testid={selectId}
          >
            {speedObjects.map((speedObject) => (
              <option key={speedObject.id} value={speedObject.id}>
                {speedObject.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="track-card__lane-scale" aria-hidden="true">
          <span>0 m</span>
          <span>{formatMeters(track.trackLengthMeters)}</span>
        </div>
        <div className="track-card__lane" aria-label={`${track.objectName} lane`} data-progress={track.progressRatio}>
          <div className="track-card__start" aria-hidden="true" />
          <div
            className="track-card__runner"
            style={runnerStyle}
            aria-hidden="true"
          >
            <span>{toRunnerCode(track.objectName)}</span>
          </div>
          <div className="track-card__runner-value" style={runnerStyle} aria-hidden="true">
            {formatMeters(track.clampedDistanceMeters)}
          </div>
          <div className="track-card__finish" aria-hidden="true" />
        </div>

        <dl className="track-card__metrics">
          <div>
            <dt>Travelled</dt>
            <dd>{formatMeters(track.clampedDistanceMeters)}</dd>
          </div>
          <div>
            <dt>Remaining</dt>
            <dd>{formatMeters(track.remainingDistanceMeters)}</dd>
          </div>
          <div>
            <dt>Elapsed</dt>
            <dd>{track.elapsedTimeSeconds.toFixed(2)}s</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
};

const formatSpeed = (track: TrackVisualState): string => {
  const lengthUnit =
    track.speedLengthUnit === SpeedLengthUnit.KILOMETERS ? "km" : "m";
  const timeUnit = track.speedTimeUnit === SpeedTimeUnit.HOURS ? "h" : "s";

  return `${track.speedValue} ${lengthUnit}/${timeUnit} (${track.speedMetersPerSecond.toFixed(2)} m/s)`;
};

const formatMeters = (value: number): string => {
  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);

  return `${rounded} m`;
};

const toRunnerCode = (objectName: string): string => {
  const words = objectName
    .replace(/[()]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "??";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
};
