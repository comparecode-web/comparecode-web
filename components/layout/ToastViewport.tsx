"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MdCheckCircleOutline, MdClose, MdErrorOutline, MdInfoOutline, MdRedo, MdUndo, MdWarningAmber } from "react-icons/md";
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

  return "border-info-border bg-info-bg text-text-primary";
}

function getDefaultIcon(tone: ToastItem["tone"]): ToastItem["icon"] {
  if (tone === "success") {
    return "success";
  }

  if (tone === "error") {
    return "error";
  }

  if (tone === "warning") {
    return "warning";
  }

  return "info";
}

function getIconClasses(tone: ToastItem["tone"]): string {
  if (tone === "success") {
    return "text-success";
  }

  if (tone === "error") {
    return "text-danger";
  }

  if (tone === "warning") {
    return "text-amber-500";
  }

  return "text-info";
}

function ToastIcon({ toast }: { toast: ToastItem }) {
  const icon = toast.icon ?? getDefaultIcon(toast.tone);
  const className = cn("mt-0.5 h-5 w-5 shrink-0", getIconClasses(toast.tone));

  if (icon === "undo") {
    return <MdUndo className={className} aria-hidden="true" />;
  }

  if (icon === "redo") {
    return <MdRedo className={className} aria-hidden="true" />;
  }

  if (icon === "success") {
    return <MdCheckCircleOutline className={className} aria-hidden="true" />;
  }

  if (icon === "warning") {
    return <MdWarningAmber className={className} aria-hidden="true" />;
  }

  if (icon === "error") {
    return <MdErrorOutline className={className} aria-hidden="true" />;
  }

  return <MdInfoOutline className={className} aria-hidden="true" />;
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
    if (toast.durationMs === null) {
      return;
    }

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
        "pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm transition-all duration-(--duration-medium) animate-slide-down-fade",
        getToneClasses(toast.tone)
      )}
    >
      <ToastIcon toast={toast} />
      <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
      {toast.isDismissible && (
        <button
          type="button"
          onClick={() => dismissToast(toast.id)}
          className="ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Dismiss notification"
          title="Dismiss notification"
        >
          <MdClose className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
