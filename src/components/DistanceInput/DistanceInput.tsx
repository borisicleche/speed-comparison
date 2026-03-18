import React, { useEffect, useMemo, useState } from "react";

import { useSimulationStore } from "../../store/simulationStore";
import {
  DistanceUnit,
  distanceToMeters,
  metersToDistance,
} from "../../utils/unitConversion";
import { Button, ButtonVariant } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import "./DistanceInput.scss";

const DISTANCE_COMPARE_EPSILON = 1e-9;
const MAX_DISTANCE_DECIMALS = 6;

const DISTANCE_MIN_BY_UNIT: Record<DistanceUnit, number> = {
  [DistanceUnit.METERS]: 1,
  [DistanceUnit.KILOMETERS]: 0.001,
};

const DISTANCE_STEP_BY_UNIT: Record<DistanceUnit, string> = {
  [DistanceUnit.METERS]: "1",
  [DistanceUnit.KILOMETERS]: "0.001",
};

export const DistanceInput = () => {
  const distance = useSimulationStore((state) => state.simulationState.distance);
  const setDistance = useSimulationStore((state) => state.setDistance);
  const [draftAmount, setDraftAmount] = useState<string>(() =>
    formatDistanceAmount(distance.amount),
  );
  const [draftUnit, setDraftUnit] = useState<DistanceUnit>(distance.unit);

  useEffect(() => {
    setDraftAmount(formatDistanceAmount(distance.amount));
    setDraftUnit(distance.unit);
  }, [distance.amount, distance.unit]);

  const parsedAmount = useMemo(
    () => Number.parseFloat(draftAmount.trim()),
    [draftAmount],
  );
  const isDraftValid = isValidDistanceAmount(parsedAmount, draftUnit);
  const isDraftInvalid = draftAmount.trim().length > 0 && !isDraftValid;
  const hasDraftUnitChanged = draftUnit !== distance.unit;
  const hasDraftMetersChanged =
    isDraftValid &&
    Math.abs(distanceToMeters(parsedAmount, draftUnit) - distance.value) >
      DISTANCE_COMPARE_EPSILON;
  const canApply = isDraftValid && (hasDraftUnitChanged || hasDraftMetersChanged);

  const handleAmountBlur = () => {
    if (!isDraftValid) {
      setDraftAmount(formatDistanceAmount(metersToDistance(distance.value, draftUnit)));
      return;
    }

    setDraftAmount(formatDistanceAmount(parsedAmount));
  };

  const applyDistance = () => {
    if (!isDraftValid) {
      return;
    }

    setDistance(parsedAmount, draftUnit);
  };

  return (
    <section className="distance-input" aria-label="Distance controls">
      <p className="distance-input__status">
        Distance:{" "}
        <span data-testid="distance-current-value">
          {formatDistanceAmount(distance.amount)} {distance.unit}
        </span>
      </p>
      <form
        className="distance-input__controls"
        onSubmit={(event) => {
          event.preventDefault();
          applyDistance();
        }}
      >
        <label htmlFor="distance-amount-input">Track length</label>
        <Input
          id="distance-amount-input"
          type="number"
          inputMode="decimal"
          min={DISTANCE_MIN_BY_UNIT[draftUnit]}
          step={DISTANCE_STEP_BY_UNIT[draftUnit]}
          value={draftAmount}
          onChange={(event) => {
            setDraftAmount(event.target.value);
          }}
          onBlur={handleAmountBlur}
          data-testid="distance-amount-input"
        />
        <Select
          id="distance-unit-select"
          value={draftUnit}
          onChange={(event) => {
            const nextUnit = event.target.value as DistanceUnit;
            const baseMeters = isDraftValid
              ? distanceToMeters(parsedAmount, draftUnit)
              : distance.value;
            setDraftUnit(nextUnit);
            setDraftAmount(
              formatDistanceAmount(metersToDistance(baseMeters, nextUnit)),
            );
          }}
          data-testid="distance-unit-select"
        >
          <option value={DistanceUnit.METERS}>m</option>
          <option value={DistanceUnit.KILOMETERS}>km</option>
        </Select>
        <Button
          variant={ButtonVariant.SECONDARY}
          type="submit"
          disabled={!canApply}
          aria-disabled={!canApply}
          data-testid="distance-apply-button"
        >
          Apply
        </Button>
      </form>
      {isDraftInvalid ? (
        <p className="distance-input__error" role="status">
          Enter a value greater than 0.
        </p>
      ) : null}
    </section>
  );
};

const isValidDistanceAmount = (value: number, unit: DistanceUnit): boolean => {
  return Number.isFinite(value) && value >= DISTANCE_MIN_BY_UNIT[unit];
};

const formatDistanceAmount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(MAX_DISTANCE_DECIMALS).replace(/\.?0+$/, "");
};
