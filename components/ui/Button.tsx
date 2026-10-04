import React from "react";
import { cn } from "@/utils/uiHelpers";
import { buttonBase, buttonVariants, controlSizes, type ButtonVariant, type ControlSize } from "./controlStyles";

export type { ButtonVariant } from "./controlStyles";
export type ButtonSize = ControlSize;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", leftIcon, rightIcon, children, disabled, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(buttonBase, buttonVariants[variant], controlSizes[size].field, className)}
        {...props}
      >
        {leftIcon && <span className={cn("flex shrink-0", controlSizes[size].iconContent)}>{leftIcon}</span>}
        {children}
        {rightIcon && <span className={cn("flex shrink-0", controlSizes[size].iconContent)}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
