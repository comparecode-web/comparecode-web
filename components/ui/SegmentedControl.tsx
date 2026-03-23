import React from "react";
import { cn } from "@/utils/uiHelpers";

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: Array<SegmentOption<T>>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps<T>) => {
  return (
    <div className={cn("flex gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 text-sm py-1.5 rounded border transition-all",
            value === option.value
              ? "bg-bg-selected border-accent-primary text-accent-primary font-semibold shadow-sm"
              : "bg-transparent border-border-default text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};