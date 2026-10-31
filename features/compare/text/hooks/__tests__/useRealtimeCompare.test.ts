import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/config/defaults";
import { HistoryService } from "@/services/historyService";
import { SettingsService } from "@/services/settingsService";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { BlockType } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";
import { getLiveUpdateDelay, isComparisonStale, LIVE_UPDATE_SIZE_LIMIT, useRealtimeCompare } from "../useRealtimeCompare";

const LEFT = ["a", "x1", "b", "c", "d", "e", "x2", "f"].join("\n");
const RIGHT = ["a", "y1", "b", "c", "d", "e", "y2", "f"].join("\n");

function startComparison() {
  act(() => {
    useEditorStore.setState({ leftText: LEFT, rightText: RIGHT });
    useEditorStore.getState().compare(useSettingsStore.getState().settings);
  });
}

describe("live update", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(SettingsService, "saveSettings").mockImplementation(() => {});
    useSettingsStore.setState({ settings: { ...defaultSettings, isRealtimeCompareEnabled: true }, isLoaded: true });
    useEditorStore.getState().clearContent();
    useEditorUIStore.setState({ isLiveUpdatePaused: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("bounds the adaptive delay", () => {
    expect(getLiveUpdateDelay(0)).toBe(150);
    expect(getLiveUpdateDelay(120)).toBe(240);
    expect(getLiveUpdateDelay(5000)).toBe(1000);
  });

  it("recomputes after the delay once a comparison exists, without writing history", () => {
    const addHistory = vi.spyOn(HistoryService, "addAsync");
    renderHook(() => useRealtimeCompare());
    startComparison();
    act(() => useEditorStore.getState().setRightText(RIGHT + "\nnew line"));
    expect(isComparisonStale(useEditorStore.getState().comparisonResult, useEditorStore.getState().leftText, useEditorStore.getState().rightText)).toBe(true);
    act(() => { vi.advanceTimersByTime(100); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.modified).toBe(RIGHT);
    act(() => { vi.advanceTimersByTime(100); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.modified).toBe(RIGHT + "\nnew line");
    expect(addHistory).not.toHaveBeenCalled();
  });

  it("restarts the delay while typing", () => {
    renderHook(() => useRealtimeCompare());
    startComparison();
    for (const suffix of ["1", "12", "123"]) {
      act(() => useEditorStore.getState().setLeftText(LEFT + suffix));
      act(() => { vi.advanceTimersByTime(100); });
    }
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT);
    act(() => { vi.advanceTimersByTime(100); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT + "123");
  });

  it("does nothing when disabled or before the first comparison", () => {
    renderHook(() => useRealtimeCompare());
    act(() => useEditorStore.getState().setLeftText("typed"));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(useEditorStore.getState().comparisonResult).toBeNull();
    startComparison();
    act(() => useSettingsStore.setState({ settings: { ...defaultSettings, isRealtimeCompareEnabled: false } }));
    act(() => useEditorStore.getState().setLeftText("typed again"));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT);
  });

  it("pauses for very large text and after a slow run", () => {
    renderHook(() => useRealtimeCompare());
    startComparison();
    act(() => useEditorStore.getState().setLeftText("x".repeat(LIVE_UPDATE_SIZE_LIMIT)));
    expect(useEditorUIStore.getState().isLiveUpdatePaused).toBe(true);
    act(() => useEditorUIStore.setState({ isLiveUpdatePaused: false }));
    expect(useEditorUIStore.getState().isLiveUpdatePaused).toBe(true);
    act(() => useEditorStore.getState().setLeftText(LEFT));
    act(() => useEditorStore.getState().compare(defaultSettings));
    act(() => useEditorUIStore.setState({ isLiveUpdatePaused: false }));
    let now = 0;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    const recompute = useEditorStore.getState().recompute;
    act(() => useEditorStore.setState({ recompute: (settings) => { now += 300; recompute(settings); } }));
    act(() => useEditorStore.getState().setLeftText(LEFT + "!"));
    act(() => { vi.advanceTimersByTime(200); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT + "!");
    expect(useEditorUIStore.getState().isLiveUpdatePaused).toBe(true);
    act(() => useEditorStore.getState().setLeftText(LEFT + "!!"));
    act(() => { vi.advanceTimersByTime(2000); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT + "!");
  });

  it("waits for input method composition to finish", () => {
    renderHook(() => useRealtimeCompare());
    startComparison();
    act(() => { document.dispatchEvent(new Event("compositionstart")); });
    act(() => useEditorStore.getState().setLeftText(LEFT + "か"));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT);
    act(() => { document.dispatchEvent(new Event("compositionend")); });
    act(() => { vi.advanceTimersByTime(250); });
    expect(useEditorStore.getState().comparisonResult!.sourceTexts!.original).toBe(LEFT + "か");
  });

  it("keeps the selected change selected across a recompute and keeps merges working", () => {
    startComparison();
    const second = useEditorStore.getState().comparisonResult!.blocks.filter((block) => block.kind !== BlockType.Unchanged)[1];
    act(() => useEditorStore.getState().selectBlock(second.id));
    act(() => useEditorStore.getState().setLeftText(LEFT.replace("x1", "x1 edited")));
    act(() => useEditorStore.getState().recompute(defaultSettings));
    const state = useEditorStore.getState();
    const selected = state.comparisonResult!.blocks.find((block) => block.isSelected)!;
    expect(selected.oldLines.some((line) => line.fragments.some((fragment) => fragment.text.includes("x2")))).toBe(true);
    expect(state.currentBlockIndex).toBe(2);
    vi.spyOn(HistoryService, "createMergeSessionAsync").mockResolvedValue("session");
    vi.spyOn(HistoryService, "appendMergeStepAsync").mockResolvedValue();
    act(() => useEditorStore.getState().mergeBlock(selected, MergeDirection.LeftToRight, defaultSettings));
    expect(useEditorStore.getState().rightText).not.toBe(RIGHT);
  });
});
