"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";
import { cn } from "@/utils/uiHelpers";

interface DialogProps extends Omit<ComponentProps<"dialog">, "open" | "onClose" | "onCancel"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dismissible?: boolean;
}

export function Dialog({ open, onOpenChange, dismissible = true, className, children, ...props }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  return <dialog {...props} ref={ref}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open && !ref.current?.open) onOpenChange(false); }}
    className={cn("fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[min(92vw,27rem)] max-w-none overflow-y-auto rounded-xl border border-border-default bg-bg-primary p-0 text-text-primary shadow-2xl backdrop:bg-black/50 [&:not([open])]:hidden", className)}>
    {children}
  </dialog>;
}
