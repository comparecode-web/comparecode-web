import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/store/useToastStore";

function resetToastStore() {
  useToastStore.setState({
    activeToasts: [],
    queuedToasts: []
  });
}

describe("useToastStore", () => {
  beforeEach(() => {
    resetToastStore();
  });

  it("stores persistent dismissible toasts with icons", () => {
    useToastStore.getState().pushToast({
      message: "Identical",
      tone: "info",
      durationMs: null,
      dedupeKey: "identical",
      icon: "info",
      isDismissible: true
    });

    expect(useToastStore.getState().activeToasts).toMatchObject([
      {
        message: "Identical",
        tone: "info",
        durationMs: null,
        dedupeKey: "identical",
        icon: "info",
        isDismissible: true
      }
    ]);
  });

  it("deduplicates active and queued toasts by key", () => {
    useToastStore.getState().pushToast({ message: "First", dedupeKey: "same" });
    useToastStore.getState().pushToast({ message: "Second", dedupeKey: "same" });

    const state = useToastStore.getState();
    expect(state.activeToasts).toHaveLength(1);
    expect(state.activeToasts[0].message).toBe("First");
    expect(state.queuedToasts).toHaveLength(0);
  });

  it("dismisses active and queued toasts by dedupe key", () => {
    useToastStore.setState({
      activeToasts: [
        { id: "active", message: "Active", tone: "info", durationMs: null, dedupeKey: "same" }
      ],
      queuedToasts: [
        { id: "queued", message: "Queued", tone: "info", durationMs: null, dedupeKey: "same" },
        { id: "other", message: "Other", tone: "info", durationMs: null, dedupeKey: "other" }
      ]
    });

    useToastStore.getState().dismissToastByDedupeKey("same");

    expect(useToastStore.getState().activeToasts).toHaveLength(0);
    expect(useToastStore.getState().queuedToasts).toMatchObject([
      { id: "other", dedupeKey: "other" }
    ]);
  });
});
