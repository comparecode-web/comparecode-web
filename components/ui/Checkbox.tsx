import React from "react";
import { cn } from "@/utils/uiHelpers";
import { controlFocus, controlDisabled } from "./controlStyles";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, containerClassName, title, ...props }, ref) => {
    return (
      <label className={cn("flex items-center gap-2 cursor-pointer", containerClassName)} title={title}>
        <input
          type="checkbox"
          ref={ref}
          className={cn("w-4 h-4 custom-checkbox rounded cursor-pointer", controlFocus, controlDisabled, className)}
          {...props}
        />
        {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
