import React, { forwardRef, type HTMLAttributes } from "react";

import { cn } from "./cn";
import "./badge.scss";

export const Badge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => {
    return <span ref={ref} className={cn("ui-badge", className)} {...props} />;
  },
);
Badge.displayName = "Badge";
