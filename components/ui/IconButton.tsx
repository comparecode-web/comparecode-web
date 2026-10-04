import React from "react";
import { cn } from "@/utils/uiHelpers";
import { buttonBase, buttonVariants, controlSizes, type ButtonVariant, type ControlSize } from "./controlStyles";

export type IconButtonVariant = ButtonVariant;
export type IconButtonSize = ControlSize;

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isActive?: boolean;
  shape?: "square" | "circle";
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", shape = "square", isActive = false, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          buttonBase,
          buttonVariants[variant],
          controlSizes[size].icon,
          shape === "circle" && "rounded-full",
          isActive && "border-border-default bg-hover-overlay text-accent-primary",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
