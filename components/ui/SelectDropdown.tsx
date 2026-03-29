"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MdExpandMore } from "react-icons/md";
import { cn } from "@/utils/uiHelpers";

export interface SelectDropdownOption {
  value: string;
  label: string;
}

interface SelectDropdownProps {
  value: string;
  options: Array<SelectDropdownOption>;
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  className,
  triggerClassName,
  menuClassName
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? value;
  }, [options, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className={cn(
          "w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm text-left outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary cursor-pointer transition-colors duration-(--duration-short)",
          triggerClassName
        )}
      >
        {selectedLabel}
      </button>
      <MdExpandMore className="absolute right-2 top-1/2 -translate-y-1/2 text-xl text-text-secondary pointer-events-none" />
      {isOpen && (
        <div
          className={cn(
            "absolute z-20 mt-1 w-full rounded-md border border-border-default bg-bg-secondary shadow-lg max-h-56 overflow-y-auto custom-scrollbar",
            menuClassName
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm transition-colors",
                option.value === value
                  ? "bg-hover-overlay text-text-primary"
                  : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
