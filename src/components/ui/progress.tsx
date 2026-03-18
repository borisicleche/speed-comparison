import React, { forwardRef, type HTMLAttributes } from "react";

import { cn } from "./cn";
import "./progress.scss";

type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
};

const clampPercent = (value: number): number => {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const clampedValue = clampPercent(value);

    return (
      <div ref={ref} className={cn("ui-progress", className)} {...props}>
        <div
          className="ui-progress__indicator"
          style={{ width: `${clampedValue}%` }}
          aria-hidden="true"
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";
