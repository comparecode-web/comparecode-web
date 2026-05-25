"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ToastItem, useToastStore } from "@/store/useToastStore";
import { cn } from "@/utils/uiHelpers";

function getToneClasses(tone: ToastItem["tone"]): string {
  if (tone === "success") {
    return "border-success/40 bg-success/10 text-text-primary";
  }

  if (tone === "error") {
    return "border-danger/40 bg-danger-bg text-text-primary";
  }

  if (tone === "warning") {
    return "border-amber-500/40 bg-amber-500/10 text-text-primary";
  }

  return "border-accent-primary/40 bg-bg-secondary text-text-primary";
}

export function ToastViewport() {
  const activeToasts = useToastStore((state) => state.activeToasts);

  if (typeof window === "undefined" || activeToasts.length === 0) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-4 top-4 flex w-[min(90vw,22rem)] flex-col gap-2" style={{ zIndex: 100 }}>
      {activeToasts.map((toast) => <ToastCard key={toast.id} toast={toast} />)}
    </div>,
    document.body
  );
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismissToast = useToastStore((state) => state.dismissToast);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      dismissToast(toast.id);
    }, toast.durationMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [toast.id, toast.durationMs, dismissToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all duration-(--duration-medium) animate-slide-down-fade",
        getToneClasses(toast.tone)
      )}
    >
      {toast.message}
    </div>
  );
}
