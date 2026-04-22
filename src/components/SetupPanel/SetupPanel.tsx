import React, { useState } from "react";

import { SPEED_OBJECTS } from "../../data/speedObjects";
import { useSimulationStore } from "../../store/simulationStore";
import { DistanceUnit, distanceToMeters } from "../../utils/unitConversion";
import { DistanceInput } from "../DistanceInput/DistanceInput";
import { Button, ButtonVariant } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import "./SetupPanel.scss";

export const SetupPanel = () => {
  const trackCount = useSimulationStore((state) => state.simulationState.tracks.length);
  const maxTracks = useSimulationStore((state) => state.simulationState.maxTracks);
  const addTrack = useSimulationStore((state) => state.addTrack);

  const [selectedObjectId, setSelectedObjectId] = useState(SPEED_OBJECTS[0].id);
  const [overrideDraftAmount, setOverrideDraftAmount] = useState("");
  const [overrideDraftUnit, setOverrideDraftUnit] = useState<DistanceUnit>(DistanceUnit.METERS);

  const canAddTrack = trackCount < maxTracks;
  const parsedOverride = Number.parseFloat(overrideDraftAmount.trim());
  const hasValidOverride =
    overrideDraftAmount.trim().length > 0 &&
    Number.isFinite(parsedOverride) &&
    parsedOverride > 0;

  const handleAddTrack = () => {
    const distanceOverride = hasValidOverride
      ? {
          amount: parsedOverride,
          unit: overrideDraftUnit,
          value: distanceToMeters(parsedOverride, overrideDraftUnit),
        }
      : undefined;

    addTrack(selectedObjectId, distanceOverride);
    setOverrideDraftAmount("");
  };

  return (
    <aside className="setup-panel" aria-label="Setup">
      <div className="setup-panel__brand">
        <p className="setup-panel__eyebrow">SpeedPlane</p>
        <h1 className="setup-panel__title">Lane comparison</h1>
      </div>

      <DistanceInput />

      <section className="setup-panel__add-lane" aria-label="Add lane">
        <p className="setup-panel__section-title">Add lane</p>

        <div className="setup-panel__field">
          <label className="setup-panel__label" htmlFor="setup-object-select">
            Object
          </label>
          <Select
            id="setup-object-select"
            value={selectedObjectId}
            onChange={(e) => setSelectedObjectId(e.target.value)}
            data-testid="setup-object-select"
          >
            {SPEED_OBJECTS.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="setup-panel__field">
          <label className="setup-panel__label" htmlFor="setup-override-amount">
            Custom distance <span className="setup-panel__optional">(optional)</span>
          </label>
          <div className="setup-panel__override-inputs">
            <Input
              id="setup-override-amount"
              type="number"
              inputMode="decimal"
              min="0.001"
              step="1"
              placeholder="Same as global"
              value={overrideDraftAmount}
              onChange={(e) => setOverrideDraftAmount(e.target.value)}
              data-testid="setup-override-amount"
            />
            <Select
              id="setup-override-unit"
              aria-label="Custom distance unit"
              value={overrideDraftUnit}
              onChange={(e) => setOverrideDraftUnit(e.target.value as DistanceUnit)}
              data-testid="setup-override-unit"
            >
              <option value={DistanceUnit.METERS}>m</option>
              <option value={DistanceUnit.KILOMETERS}>km</option>
            </Select>
          </div>
        </div>

        <Button
          variant={ButtonVariant.PRIMARY}
          onClick={handleAddTrack}
          disabled={!canAddTrack}
          aria-disabled={!canAddTrack}
          data-testid="add-track-button"
        >
          + Add lane
        </Button>
      </section>

      <p className="setup-panel__lane-count" data-testid="track-count">
        Lanes: <span>{trackCount}</span> / {maxTracks}
      </p>
    </aside>
  );
};
