import React from "react";
import { cn } from "@/utils/uiHelpers";

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  displayValue?: string | number;
  containerClassName?: string;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, label, displayValue, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1", containerClassName)}>
        {(label || displayValue !== undefined) && (
          <div className="flex justify-between items-center">
            {label && <span className="text-sm font-medium text-text-primary">{label}</span>}
            {displayValue !== undefined && <span className="text-sm font-bold text-text-primary">{displayValue}</span>}
          </div>
        )}
        <input
          type="range"
          ref={ref}
          className={cn("w-full custom-slider", className)}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";