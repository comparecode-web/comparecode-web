import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/store/useToastStore";
import { syncIdenticalDocumentsToast } from "@/features/compare/text/utils/identicalDocumentsToast";

function resetToastStore() {
  useToastStore.setState({
    activeToasts: [],
    queuedToasts: []
  });
}

describe("syncIdenticalDocumentsToast", () => {
  beforeEach(() => {
    resetToastStore();
  });

  it("shows a persistent dismissible info toast when documents are identical", () => {
    syncIdenticalDocumentsToast("same", "same");

    expect(useToastStore.getState().activeToasts).toMatchObject([
      {
        message: "The two documents are completely identical.",
        tone: "info",
        durationMs: null,
        dedupeKey: "text-documents-identical",
        icon: "info",
        isDismissible: true
      }
    ]);
  });

  it("does not show an identical documents toast for two empty documents", () => {
    syncIdenticalDocumentsToast("", "");

    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("dismisses the identical documents toast when documents differ", () => {
    syncIdenticalDocumentsToast("same", "same");
    syncIdenticalDocumentsToast("same", "different");

    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });
});
