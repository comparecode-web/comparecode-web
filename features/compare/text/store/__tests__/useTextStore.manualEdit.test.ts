import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/config/defaults";
import { HistoryService } from "@/services/historyService";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { BlockType } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";

const LEFT = ["a", "x1", "b", "c", "x2", "d"].join("\n");
const RIGHT = ["a", "y1", "b", "c", "y2", "d"].join("\n");

function startSession() {
  const store = useEditorStore.getState();
  store.setLeftText(LEFT);
  store.setRightText(RIGHT);
  store.compare(defaultSettings);
  store.markHistorySnapshot(LEFT, RIGHT);
  store.setHistorySessionId("session");
}

function mergeFirstChange() {
  const block = useEditorStore.getState().comparisonResult!.blocks.find((candidate) => candidate.kind !== BlockType.Unchanged)!;
  useEditorStore.getState().mergeBlock(block, MergeDirection.LeftToRight, defaultSettings);
}

describe("manual edits in merge history", () => {
  const calls: string[] = [];
  beforeEach(() => {
    calls.length = 0;
    useEditorStore.getState().clearContent();
    vi.spyOn(HistoryService, "appendEditStepAsync").mockImplementation(async (...args) => { calls.push(`edit:${JSON.stringify(args)}`); });
    vi.spyOn(HistoryService, "appendMergeStepAsync").mockImplementation(async () => { calls.push("merge"); });
  });

  afterEach(() => vi.restoreAllMocks());

  it("records an edit made after comparing before the next merge", async () => {
    startSession();
    useEditorStore.getState().setRightText(RIGHT + "\ntyped");
    useEditorStore.getState().compare(defaultSettings);
    mergeFirstChange();
    await useEditorStore.getState().queueHistoryWrite(async () => {});
    expect(calls).toEqual([`edit:${JSON.stringify(["session", LEFT, RIGHT, LEFT, RIGHT + "\ntyped"])}`, "merge"]);
  });

  it("does not record an edit when nothing was typed", async () => {
    startSession();
    mergeFirstChange();
    mergeFirstChange();
    await useEditorStore.getState().queueHistoryWrite(async () => {});
    expect(calls).toEqual(["merge", "merge"]);
  });

  it("records typed text before undo so undo restores the state before typing", async () => {
    startSession();
    const undo = vi.spyOn(HistoryService, "undoMergeStepAsync").mockImplementation(async () => {
      calls.push("undo");
      return { originalText: LEFT, modifiedText: RIGHT, stepCursor: 0, stepCount: 1 };
    });
    useEditorStore.getState().setLeftText(LEFT + "\ntyped");
    await expect(useEditorStore.getState().undoMergeStep(defaultSettings)).resolves.toBe("applied");
    expect(calls).toEqual([`edit:${JSON.stringify(["session", LEFT, RIGHT, LEFT + "\ntyped", RIGHT])}`, "undo"]);
    expect(useEditorStore.getState().leftText).toBe(LEFT);
    expect(undo).toHaveBeenCalledWith("session");
    await useEditorStore.getState().undoMergeStep(defaultSettings);
    expect(calls.filter((call) => call.startsWith("edit"))).toHaveLength(1);
  });

  it("records typed text before redo so redo cannot overwrite it", async () => {
    startSession();
    vi.spyOn(HistoryService, "redoMergeStepAsync").mockImplementation(async () => { calls.push("redo"); return null; });
    useEditorStore.getState().setRightText("typed");
    await expect(useEditorStore.getState().redoMergeStep(defaultSettings)).resolves.toBe("not-available");
    expect(calls).toEqual([`edit:${JSON.stringify(["session", LEFT, RIGHT, LEFT, "typed"])}`, "redo"]);
    expect(useEditorStore.getState().rightText).toBe("typed");
  });

  it("forgets the known state when new text is imported or cleared", async () => {
    startSession();
    useEditorStore.getState().importText("left", "imported");
    useEditorStore.getState().setHistorySessionId("session");
    vi.spyOn(HistoryService, "undoMergeStepAsync").mockResolvedValue(null);
    await useEditorStore.getState().undoMergeStep(defaultSettings);
    expect(calls).toEqual([]);
  });
});
