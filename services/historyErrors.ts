export const HISTORY_WRITE_ERROR_TOAST_KEY = "history-write-error";

export function isStorageQuotaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, inner } = error as { name?: unknown; inner?: { name?: unknown } };
  return name === "QuotaExceededError" || inner?.name === "QuotaExceededError";
}

export function getHistoryWriteErrorMessage(error: unknown): string {
  return isStorageQuotaError(error)
    ? "Browser storage is full, so this change was not saved to history. Delete older comparisons in History to free space."
    : "This change could not be saved to history.";
}
