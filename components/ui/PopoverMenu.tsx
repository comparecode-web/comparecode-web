"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type RefObject, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/uiHelpers";
import { remToCssPixels } from "@/utils/domSizing";

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
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<CSSProperties>({ position: "fixed", visibility: "hidden", width: "max-content", maxWidth: "calc(100vw - 1rem)" });

  useLayoutEffect(() => {
    if (!isOpen) return;
    const updatePosition = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      setPortalTarget(trigger.closest("dialog") ?? document.body);
      const rect = trigger.getBoundingClientRect();
      const edge = remToCssPixels(0.5);
      const gap = remToCssPixels(0.25);
      const dropdownMaxHeight = remToCssPixels(14);
      const width = Math.min(role === "listbox" ? rect.width : Math.max(rect.width, menu.scrollWidth), Math.max(0, window.innerWidth - 2 * edge));
      const below = window.innerHeight - rect.bottom - edge - gap;
      const above = rect.top - edge - gap;
      const placeAbove = below < Math.min(menu.scrollHeight, dropdownMaxHeight) && above > below;
      const left = Math.max(edge, Math.min(align === "end" ? rect.right - width : rect.left, window.innerWidth - width - edge));
      const next: CSSProperties = { position: "fixed", visibility: "visible", width, left, top: placeAbove ? undefined : rect.bottom + gap, bottom: placeAbove ? window.innerHeight - rect.top + gap : undefined, maxHeight: Math.min(role === "listbox" ? dropdownMaxHeight : Infinity, Math.max(0, placeAbove ? above : below)) };
      setPosition((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    updatePosition();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updatePosition);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => { observer?.disconnect(); window.removeEventListener("resize", updatePosition); window.removeEventListener("scroll", updatePosition, true); };
  }, [align, isOpen, portalTarget, role, triggerRef]);

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
      event.stopImmediatePropagation();
      onOpenChange(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape, true);
    const observer = new MutationObserver(() => {
      if (triggerRef.current?.closest("[inert]")) onOpenChange(false);
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["inert"] });

    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape, true);
    };
  }, [isOpen, onOpenChange, triggerRef]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role={role}
      style={position}
      className={cn(
        "z-[70] overflow-y-auto rounded-xl border border-border-default bg-bg-primary shadow-lg",
        className
      )}
      onKeyDown={onKeyDown}
    >
      {children}
    </div>,
    portalTarget ?? document.body
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
