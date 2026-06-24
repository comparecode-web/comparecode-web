"use client";

import { useEffect, useRef, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject } from "react";
import { cn } from "@/utils/uiHelpers";

interface PopoverMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  className?: string;
  align?: "start" | "end";
  role?: string;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

export function PopoverMenu({
  isOpen,
  onOpenChange,
  triggerRef,
  children,
  className,
  align = "start",
  role = "menu",
  onKeyDown
}: PopoverMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      onOpenChange(false);
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      onOpenChange(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onOpenChange, triggerRef]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      role={role}
      className={cn(
        "absolute top-full z-20 mt-1 rounded-md border border-border-default bg-bg-primary shadow-lg",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>
  );
}

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  isSelected?: boolean;
}

export function MenuItem({ className, isActive = false, isSelected = false, children, ...props }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-semibold transition-colors focus:outline-none",
        isSelected || isActive ? "bg-hover-overlay text-text-primary" : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
