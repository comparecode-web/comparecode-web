import { HISTORY_WRITE_ERROR_TOAST_KEY, getHistoryWriteErrorMessage } from "@/services/historyErrors";
import { useToastStore } from "./useToastStore";

export function reportHistoryWriteError(error: unknown): void {
  console.error(error);
  const message = getHistoryWriteErrorMessage(error);
  useToastStore.getState().pushToast({ message, tone: "error", dedupeKey: `${HISTORY_WRITE_ERROR_TOAST_KEY}:${message}` });
}
