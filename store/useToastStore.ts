import { create } from "zustand";
import { UI_CONSTANTS } from "@/config/constants";

export type ToastTone = "success" | "info" | "warning" | "error";
export type ToastIcon = "info" | "success" | "warning" | "error" | "undo" | "redo";

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
  durationMs: number | null;
  dedupeKey?: string;
  icon?: ToastIcon;
  isDismissible?: boolean;
}

export interface PushToastParams {
  message: string;
  tone?: ToastTone;
  durationMs?: number | null;
  dedupeKey?: string;
  icon?: ToastIcon;
  isDismissible?: boolean;
}

interface ToastState {
  activeToasts: Array<ToastItem>;
  queuedToasts: Array<ToastItem>;
  pushToast: (toast: PushToastParams) => void;
  dismissToast: (id: string) => void;
  dismissToastByDedupeKey: (dedupeKey: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  activeToasts: [],
  queuedToasts: [],
  pushToast: ({
    message,
    tone = "info",
    durationMs = UI_CONSTANTS.TOAST_VISIBLE_DURATION_MS,
    dedupeKey,
    icon,
    isDismissible = false
  }: PushToastParams) => {
    const toast: ToastItem = {
      id: crypto.randomUUID(),
      message,
      tone,
      durationMs,
      dedupeKey,
      icon,
      isDismissible
    };

    set((state) => {
      if (dedupeKey) {
        const alreadyPresent = state.activeToasts.some((item) => item.dedupeKey === dedupeKey)
          || state.queuedToasts.some((item) => item.dedupeKey === dedupeKey);

        if (alreadyPresent) {
          return state;
        }
      }

      if (state.activeToasts.length < UI_CONSTANTS.TOAST_MAX_ACTIVE) {
        return { activeToasts: [...state.activeToasts, toast] };
      }

      return { queuedToasts: [...state.queuedToasts, toast] };
    });
  },
  dismissToast: (id: string) => {
    set((state) => {
      const remainingActive = state.activeToasts.filter((toast) => toast.id !== id);
      if (remainingActive.length === state.activeToasts.length) {
        return state;
      }

      if (state.queuedToasts.length === 0) {
        return { activeToasts: remainingActive };
      }

      const [nextToast, ...remainingQueue] = state.queuedToasts;
      return {
        activeToasts: [...remainingActive, nextToast],
        queuedToasts: remainingQueue
      };
    });
  },
  dismissToastByDedupeKey: (dedupeKey: string) => {
    set((state) => ({
      activeToasts: state.activeToasts.filter((toast) => toast.dedupeKey !== dedupeKey),
      queuedToasts: state.queuedToasts.filter((toast) => toast.dedupeKey !== dedupeKey)
    }));
  }
}));
