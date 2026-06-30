"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { MdExpandMore } from "react-icons/md";
import { PopoverMenu } from "@/components/ui/PopoverMenu";
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
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const selectedLabel = useMemo(() => {
    const selected = options.find((option) => option.value === value);
    return selected?.label ?? value;
  }, [options, value]);

  const selectedIndex = useMemo(() => {
    const index = options.findIndex((option) => option.value === value);
    return index >= 0 ? index : 0;
  }, [options, value]);

  const safeActiveIndex = options[activeIndex] ? activeIndex : selectedIndex;

  const openDropdown = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const commitSelection = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const moveActiveIndex = (direction: 1 | -1) => {
    if (options.length === 0) {
      return;
    }

    setActiveIndex((current) => (current + direction + options.length) % options.length);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    if (isOpen && (event.key === "Enter" || event.key === " ")) {
      const option = options[safeActiveIndex];
      if (option) {
        commitSelection(option.value);
      }
      return;
    }

    if (!isOpen && event.key === "ArrowDown") {
      setActiveIndex(options.length ? (selectedIndex + 1) % options.length : 0);
      setIsOpen(true);
      return;
    }

    if (!isOpen && event.key === "ArrowUp") {
      setActiveIndex(options.length ? (selectedIndex - 1 + options.length) % options.length : 0);
      setIsOpen(true);
      return;
    }

    if (!isOpen) {
      openDropdown();
      return;
    }

    if (event.key === "ArrowDown") {
      moveActiveIndex(1);
    }

    if (event.key === "ArrowUp") {
      moveActiveIndex(-1);
    }
  };

  const handleListboxKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveActiveIndex(1);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveActiveIndex(-1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[safeActiveIndex];
      if (option) {
        commitSelection(option.value);
      }
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openDropdown();
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        className={cn(
          "w-full bg-bg-secondary text-text-primary border border-border-default rounded-md pl-3 pr-8 py-2 text-sm text-left outline-none focus:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary cursor-pointer transition-colors duration-(--duration-short)",
          triggerClassName
        )}
      >
        {selectedLabel}
      </button>
      <MdExpandMore className="absolute right-2 top-1/2 -translate-y-1/2 text-xl text-text-secondary pointer-events-none" />
      <PopoverMenu
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        triggerRef={triggerRef}
        role="listbox"
        onKeyDown={handleListboxKeyDown}
        className={cn("w-full max-h-56 overflow-y-auto bg-bg-secondary py-1 custom-scrollbar", menuClassName)}
      >
        <div id={listboxId}>
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === safeActiveIndex;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSelection(option.value)}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors focus:outline-none",
                  isSelected || isActive
                    ? "bg-hover-overlay text-text-primary"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </PopoverMenu>
    </div>
  );
}
