import React from "react";
import { cn } from "@/utils/uiHelpers";

export type ButtonVariant = "primary" | "danger" | "success" | "ghost" | "outline";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-1 font-semibold rounded transition-all focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-accent-primary text-white hover:bg-accent-hover shadow-sm",
      danger: "bg-danger-bg text-danger border border-danger/20 hover:brightness-95",
      success: "bg-success text-white hover:bg-success-hover shadow-sm",
      ghost: "bg-transparent text-text-secondary hover:bg-hover-overlay hover:text-text-primary",
      outline: "bg-transparent border border-border-default text-text-primary hover:bg-hover-overlay",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-8 py-2.5 text-base",
      icon: "p-1.5 text-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {leftIcon && <span className="flex shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="flex shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";