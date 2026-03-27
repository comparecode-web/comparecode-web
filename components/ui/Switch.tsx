import React from "react";
import { cn } from "@/utils/uiHelpers";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  containerClassName?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, containerClassName, title, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-3 cursor-pointer", containerClassName)} title={title}>
        <span className="relative inline-flex h-6 w-11 shrink-0">
          <input
            type="checkbox"
            ref={ref}
            className={cn("peer sr-only", className)}
            {...props}
          />
          <span className="absolute inset-0 rounded-full border border-border-default bg-bg-secondary transition-colors peer-checked:border-accent-primary peer-checked:bg-accent-primary/20" />
          <span className="absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-text-secondary transition-all peer-checked:left-6 peer-checked:bg-accent-primary" />
        </span>
        {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = "Switch";
