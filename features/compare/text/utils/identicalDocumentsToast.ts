import { useToastStore } from "@/store/useToastStore";

const IDENTICAL_DOCUMENTS_TOAST_KEY = "text-documents-identical";

export function syncIdenticalDocumentsToast(leftText: string, rightText: string): void {
  const { pushToast, dismissToastByDedupeKey } = useToastStore.getState();

  if ((leftText || rightText) && leftText === rightText) {
    pushToast({
      message: "The two documents are completely identical.",
      tone: "info",
      durationMs: null,
      dedupeKey: IDENTICAL_DOCUMENTS_TOAST_KEY,
      icon: "info",
      isDismissible: true
    });
    return;
  }

  dismissToastByDedupeKey(IDENTICAL_DOCUMENTS_TOAST_KEY);
}
