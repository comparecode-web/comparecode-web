"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/uiHelpers";
import { Popover, type PopoverProps } from "./Popover";
import { controlDisabled, controlFocus } from "./controlStyles";

export function PopoverMenu({ onKeyDown, ...props }: Omit<PopoverProps, "role" | "focusFirstItem">) {
  return <Popover {...props} role="menu" focusFirstItem onKeyDown={event => {
    onKeyDown?.(event);
    if (event.defaultPrevented || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'));
    if (!items.length) return;
    event.preventDefault();
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (index + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
    items[next].focus();
  }} />;
}

interface MenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  isSelected?: boolean;
}

export function MenuItem({ className, isActive = false, isSelected = false, children, ...props }: MenuItemProps) {
  return <button type="button" role="menuitem" className={cn(
    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-semibold transition-colors",
    controlFocus, controlDisabled,
    isSelected || isActive ? "bg-hover-overlay text-text-primary" : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary",
    className
  )} {...props}>{children}</button>;
}
