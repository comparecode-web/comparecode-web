import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/store/useToastStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { defaultSettings } from "@/config/defaults";

function resetStores() {
  useToastStore.setState({
    activeToasts: [],
    queuedToasts: []
  });

  useEditorStore.setState({
    leftText: "",
    rightText: "",
    historySessionId: null,
    historyRefreshKey: 0,
    comparisonResult: null,
    totalSelectableBlocks: 0,
    currentBlockIndex: 0
  });
}

describe("useTextStore identical documents toast integration", () => {
  beforeEach(() => {
    resetStores();
  });

  it("does not show the identical documents toast while editing input only", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");

    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("shows the identical documents toast after an actual comparison", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");

    useEditorStore.getState().compare(defaultSettings);

    expect(useToastStore.getState().activeToasts).toMatchObject([
      {
        dedupeKey: "text-documents-identical",
        durationMs: null,
        isDismissible: true
      }
    ]);
  });
});
