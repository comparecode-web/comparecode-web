import React from "react";
import { cn } from "@/utils/uiHelpers";

export type SelectionMode = "single" | "multiple";

export interface SelectionBarOption<T extends string> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface SelectionBarBaseProps<T extends string> {
  options: Array<SelectionBarOption<T>>;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

interface SelectionBarSingleProps<T extends string> extends SelectionBarBaseProps<T> {
  selectionMode?: "single";
  value: T;
  onChange: (value: T) => void;
}

interface SelectionBarMultipleProps<T extends string> extends SelectionBarBaseProps<T> {
  selectionMode: "multiple";
  value: Array<T>;
  onChange: (value: Array<T>) => void;
}

export type SelectionBarProps<T extends string> = SelectionBarSingleProps<T> | SelectionBarMultipleProps<T>;

export const SelectionBar = <T extends string>({
  options,
  className,
  buttonClassName,
  disabled = false,
  selectionMode = "single",
  value,
  onChange
}: SelectionBarProps<T>) => {
  const isMultiple = selectionMode === "multiple";

  const isSelected = (optionValue: T): boolean => {
    if (isMultiple) {
      return (value as Array<T>).includes(optionValue);
    }
    return value === optionValue;
  };

  const handleSelect = (optionValue: T): void => {
    if (disabled) {
      return;
    }

    if (isMultiple) {
      const currentValues = value as Array<T>;
      const hasValue = currentValues.includes(optionValue);
      const nextValues = hasValue ? currentValues.filter((item) => item !== optionValue) : [...currentValues, optionValue];
      (onChange as (next: Array<T>) => void)(nextValues);
      return;
    }

    if (value !== optionValue) {
      (onChange as (next: T) => void)(optionValue);
    }
  };

  return (
    <div
      role={isMultiple ? "group" : "radiogroup"}
      className={cn("inline-flex w-full overflow-hidden rounded-md border border-border-default bg-bg-primary", className)}
    >
      {options.map((option) => {
        const selected = isSelected(option.value);
        const optionDisabled = disabled || option.disabled;

        return (
          <button
            key={option.value}
            type="button"
            role={isMultiple ? "checkbox" : "radio"}
            aria-checked={selected}
            aria-disabled={optionDisabled}
            disabled={optionDisabled}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "relative flex-1 border-r border-border-default px-3 py-1.5 text-sm transition-colors outline-none last:border-r-0",
              "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-accent-primary/45",
              selected
                ? "bg-bg-selected text-accent-primary font-semibold"
                : "bg-transparent text-text-secondary hover:bg-hover-overlay hover:text-text-primary",
              optionDisabled && "cursor-not-allowed opacity-50",
              buttonClassName
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};