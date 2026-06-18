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
    areComparedTextsIdentical: false,
    totalSelectableBlocks: 0,
    currentBlockIndex: 0
  });
}

describe("useTextStore identical text state", () => {
  beforeEach(() => {
    resetStores();
  });

  it("does not mark compared texts as identical while editing input only", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(false);
    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("marks compared texts as identical after an actual comparison", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");

    useEditorStore.getState().compare(defaultSettings);

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(true);
    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("does not mark two empty compared texts as identical", () => {
    useEditorStore.getState().compare(defaultSettings);

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(false);
    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("does not mark different compared texts as identical", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("different");

    useEditorStore.getState().compare(defaultSettings);

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(false);
    expect(useToastStore.getState().activeToasts).toHaveLength(0);
  });

  it("clears the identical compared text state", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");
    useEditorStore.getState().compare(defaultSettings);

    useEditorStore.getState().clearContent();

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(false);
  });

  it("clears the identical compared text state when text changes", () => {
    useEditorStore.getState().setLeftText("same");
    useEditorStore.getState().setRightText("same");
    useEditorStore.getState().compare(defaultSettings);

    useEditorStore.getState().setRightText("different");

    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(false);
  });
});
