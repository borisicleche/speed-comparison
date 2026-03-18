import React, { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "./cn";
import "./input.scss";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input ref={ref} className={cn("ui-input", className)} {...props} />;
  },
);
Input.displayName = "Input";
