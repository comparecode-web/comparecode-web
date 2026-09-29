import { beforeEach, describe, expect, it } from "vitest";
import { useToastStore } from "@/store/useToastStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { defaultSettings } from "@/config/defaults";
import { BlockType } from "@/features/compare/text/types/diff";

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

describe("text file import state", () => {
  beforeEach(resetStores);

  it("fills only the selected input before the first comparison", () => {
    useEditorStore.getState().importText("left", "old\n");
    useEditorStore.getState().importText("right", "new\r\n");
    const state = useEditorStore.getState();
    expect(state.leftText).toBe("old\n");
    expect(state.rightText).toBe("new\r\n");
    expect(state.comparisonResult).toBeNull();
  });

  it("replaces an input without comparing and clears the stale result and merge session", () => {
    const store = useEditorStore.getState();
    store.setLeftText("old");
    store.setRightText("new");
    store.compare(defaultSettings);
    const firstBlock = useEditorStore.getState().comparisonResult?.blocks.find((block) => block.kind !== BlockType.Unchanged);
    store.selectBlock(firstBlock?.id ?? null);
    store.setHistorySessionId("prior-session");
    store.importText("right", "old");
    const state = useEditorStore.getState();
    expect(state.leftText).toBe("old");
    expect(state.rightText).toBe("old");
    expect(state.comparisonResult).toBeNull();
    expect(state.areComparedTextsIdentical).toBe(false);
    expect(state.currentBlockIndex).toBe(0);
    expect(state.totalSelectableBlocks).toBe(0);
    expect(state.historySessionId).toBeNull();
    state.compare(defaultSettings);
    expect(useEditorStore.getState().areComparedTextsIdentical).toBe(true);
  });
});

describe("active whitespace comparison state", () => {
  beforeEach(resetStores);

  it("removes selection, navigation targets, and change blocks when whitespace is ignored", () => {
    const store = useEditorStore.getState();
    store.setLeftText("  value = 1;\nnext\n");
    store.setRightText("\tvalue  =  1;\n\nnext\n");
    store.compare({ ...defaultSettings, ignoreWhitespace: false });
    const before = useEditorStore.getState();
    expect(before.totalSelectableBlocks).toBeGreaterThan(0);
    before.selectBlock(before.comparisonResult!.blocks.find((block) => block.kind !== BlockType.Unchanged)!.id);
    expect(useEditorStore.getState().currentBlockIndex).toBeGreaterThan(0);

    useEditorStore.getState().compare({ ...defaultSettings, ignoreWhitespace: true });
    const after = useEditorStore.getState();
    expect(after.totalSelectableBlocks).toBe(0);
    expect(after.currentBlockIndex).toBe(0);
    expect(after.comparisonResult!.blocks.every((block) => block.kind === BlockType.Unchanged && !block.isSelected)).toBe(true);
    expect(after.areComparedTextsIdentical).toBe(false);
    after.selectBlock(after.comparisonResult!.blocks[0].id);
    expect(useEditorStore.getState().currentBlockIndex).toBe(0);
  });
});
