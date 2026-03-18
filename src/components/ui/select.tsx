import React, { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "./cn";
import "./select.scss";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select ref={ref} className={cn("ui-select", className)} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
