import React, { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "./cn";
import "./button.scss";

export enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DANGER = "danger",
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = ButtonVariant.PRIMARY, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn("ui-button", `ui-button--${variant}`, className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
