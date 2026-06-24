import React from "react";
import { cn } from "@/utils/uiHelpers";

export type IconButtonVariant = "ghost" | "primary" | "dangerGhost" | "toolbar";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  isActive?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "md", isActive = false, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex shrink-0 items-center justify-center rounded border border-transparent font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/45 disabled:cursor-not-allowed disabled:opacity-50";

    const variants: Record<IconButtonVariant, string> = {
      ghost: "text-text-secondary hover:border-border-default hover:bg-hover-overlay hover:text-text-primary",
      primary: "bg-accent-primary text-white shadow-sm hover:bg-accent-hover",
      dangerGhost: "text-danger hover:border-danger/30 hover:bg-danger/10 hover:text-danger-hover",
      toolbar: "text-text-secondary hover:border-border-default hover:bg-hover-overlay hover:text-text-primary"
    };

    const sizes: Record<IconButtonSize, string> = {
      sm: "h-8 min-w-8 px-2 text-sm",
      md: "h-9 min-w-9 px-2.5 text-base",
      lg: "h-11 min-w-11 px-3 text-xl"
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
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
