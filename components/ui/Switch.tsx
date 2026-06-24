import React from "react";
import { cn } from "@/utils/uiHelpers";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string;
  containerClassName?: string;
  size?: "sm" | "md";
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, containerClassName, title, size = "md", ...props }, ref) => {
    const sizes = {
      sm: {
        track: "h-5 w-9",
        thumb: "h-3.5 w-3.5 peer-checked:left-5",
        label: "text-xs"
      },
      md: {
        track: "h-6 w-11",
        thumb: "h-4 w-4 peer-checked:left-6",
        label: "text-sm"
      }
    };

    return (
      <label className={cn("flex items-center gap-3 cursor-pointer", containerClassName)} title={title}>
        <span className={cn("relative inline-flex shrink-0", sizes[size].track)}>
          <input
            type="checkbox"
            ref={ref}
            className={cn("peer sr-only", className)}
            {...props}
          />
          <span className="absolute inset-0 rounded-full border border-border-default bg-bg-secondary transition-colors peer-checked:border-accent-primary peer-checked:bg-accent-primary/20" />
          <span className={cn("absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full bg-text-secondary transition-all peer-checked:bg-accent-primary", sizes[size].thumb)} />
        </span>
        {label && <span className={cn("font-medium text-text-primary", sizes[size].label)}>{label}</span>}
      </label>
    );
  }
);

Switch.displayName = "Switch";
