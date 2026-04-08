import { type CSSProperties, useEffect, useState } from "react";
import React from "react";

import { Badge } from "../ui/badge";
import { Button, ButtonVariant } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { TrackVisualState } from "../../store/simulationSelectors";
import {
  DistanceUnit,
  SpeedLengthUnit,
  SpeedTimeUnit,
  metersToDistance,
} from "../../utils/unitConversion";
import "./Track.scss";

type TrackProps = {
  track: TrackVisualState;
  canRemoveTrack: boolean;
  isRunning: boolean;
  onRemoveTrack: (trackId: string) => void;
  onSetTrackDistance: (trackId: string, amount: number, unit: DistanceUnit) => void;
  onClearTrackDistance: (trackId: string) => void;
};

export const Track = ({
  track,
  canRemoveTrack,
  isRunning,
  onRemoveTrack,
  onSetTrackDistance,
  onClearTrackDistance,
}: TrackProps) => {
  const runnerStyle = {
    "--progress-ratio": String(track.progressRatio),
  } as CSSProperties;
  const distanceInputId = `track-distance-${track.trackId}`;
  const [isEditingDistance, setIsEditingDistance] = useState(false);

  const [draftAmount, setDraftAmount] = useState(() =>
    formatDistanceAmount(
      track.distanceOverride
        ? track.distanceOverride.amount
        : metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
    ),
  );
  const [draftUnit, setDraftUnit] = useState<DistanceUnit>(
    track.distanceOverride?.unit ?? DistanceUnit.METERS,
  );

  useEffect(() => {
    if (track.distanceOverride) {
      setDraftAmount(formatDistanceAmount(track.distanceOverride.amount));
      setDraftUnit(track.distanceOverride.unit);
    } else {
      setDraftAmount(
        formatDistanceAmount(
          metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
        ),
      );
      setDraftUnit(DistanceUnit.METERS);
    }
  }, [track.distanceOverride, track.effectiveTrackLengthMeters]);

  const handleDistanceBlur = () => {
    const parsed = Number.parseFloat(draftAmount.trim());

    if (!Number.isFinite(parsed) || parsed <= 0) {
      // Revert to current effective value
      if (track.distanceOverride) {
        setDraftAmount(formatDistanceAmount(track.distanceOverride.amount));
        setDraftUnit(track.distanceOverride.unit);
      } else {
        setDraftAmount(
          formatDistanceAmount(
            metersToDistance(track.effectiveTrackLengthMeters, DistanceUnit.METERS),
          ),
        );
      }

      return;
    }

    onSetTrackDistance(track.trackId, parsed, draftUnit);
  };

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
        <div className="track-card__controls track-card__distance-override">
          <label htmlFor={distanceInputId}>
            Distance
            {track.distanceOverride &&
            track.distanceOverride.value !== track.globalTrackLengthMeters ? (
              <button
                type="button"
                className="track-card__use-global"
                onClick={() => {
                  onClearTrackDistance(track.trackId);
                  setIsEditingDistance(false);
                }}
                disabled={isRunning}
                aria-label="Use global track length"
                data-testid={`clear-distance-${track.trackId}`}
              >
                Use global
              </button>
            ) : (
              <span className="track-card__global-badge">(global)</span>
            )}
          </label>
          {isEditingDistance ? (
            <div className="track-card__distance-edit">
              <Input
                id={distanceInputId}
                type="number"
                inputMode="decimal"
                min="0.001"
                step="1"
                value={draftAmount}
                disabled={isRunning}
                onChange={(e) => setDraftAmount(e.target.value)}
                onBlur={handleDistanceBlur}
                data-testid={`track-distance-amount-${track.trackId}`}
                autoFocus
              />
              <Select
                value={draftUnit}
                disabled={isRunning}
                onChange={(e) => {
                  const newUnit = e.target.value as DistanceUnit;
                  setDraftUnit(newUnit);
                  const parsed = Number.parseFloat(draftAmount.trim());
                  if (Number.isFinite(parsed) && parsed > 0) {
                    onSetTrackDistance(track.trackId, parsed, newUnit);
                  }
                }}
                data-testid={`track-distance-unit-${track.trackId}`}
              >
                <option value={DistanceUnit.METERS}>m</option>
                <option value={DistanceUnit.KILOMETERS}>km</option>
              </Select>
              <button
                type="button"
                className="track-card__distance-done"
                onClick={() => setIsEditingDistance(false)}
              >
                Done
              </button>
            </div>
          ) : (
            <div className="track-card__distance-display">
              <span
                className="track-card__distance-value"
                data-testid={`track-distance-amount-${track.trackId}`}
              >
                {draftAmount} {draftUnit}
              </span>
              <button
                type="button"
                className="track-card__distance-edit-btn"
                onClick={() => setIsEditingDistance(true)}
                disabled={isRunning}
                data-testid={`edit-distance-${track.trackId}`}
              >
                Edit
              </button>
            </div>
          )}
        </div>

        <div className="track-card__lane-scale" aria-hidden="true">
          <span>0 m</span>
          <span>{formatMeters(track.effectiveTrackLengthMeters)}</span>
        </div>
        <div
          className="track-card__lane"
          aria-label={`${track.objectName} lane`}
          data-progress={track.progressRatio}
        >
          <div className="track-card__start" aria-hidden="true" />
          <div
            className="track-card__runner"
            style={runnerStyle}
            aria-hidden="true"
          >
            <span>{toRunnerCode(track.objectName)}</span>
          </div>
          <div
            className="track-card__runner-value"
            style={runnerStyle}
            aria-hidden="true"
          >
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

const formatDistanceAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(6).replace(/\.?0+$/, "");
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
