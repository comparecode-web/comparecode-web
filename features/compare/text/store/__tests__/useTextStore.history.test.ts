import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultSettings } from "@/config/defaults";
import { HistoryService } from "@/services/historyService";
import { useToastStore } from "@/store/useToastStore";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { BlockType } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";

const LEFT = ["a", "x1", "b", "c", "x2", "d", "e", "x3", "f"].join("\n");
const RIGHT = ["a", "y1", "b", "c", "y2", "d", "e", "y3", "f"].join("\n");

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function compareInputs() {
  const store = useEditorStore.getState();
  store.setLeftText(LEFT);
  store.setRightText(RIGHT);
  store.compare(defaultSettings);
}

function mergeFirstChange() {
  const block = useEditorStore.getState().comparisonResult!.blocks.find((candidate) => candidate.kind !== BlockType.Unchanged)!;
  useEditorStore.getState().mergeBlock(block, MergeDirection.LeftToRight, defaultSettings);
}

describe("useTextStore history writes", () => {
  beforeEach(() => {
    useToastStore.setState({ activeToasts: [], queuedToasts: [] });
    useEditorStore.getState().clearContent();
    vi.spyOn(HistoryService, "createMergeSessionAsync").mockResolvedValue("merge-session");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("persists rapid merges one at a time and in order", async () => {
    let active = 0;
    let maxActive = 0;
    const pending: Array<ReturnType<typeof deferred<void>>> = [];
    const append = vi.spyOn(HistoryService, "appendMergeStepAsync").mockImplementation(() => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      const step = deferred<void>();
      pending.push(step);
      return step.promise.finally(() => { active -= 1; });
    });
    compareInputs();

    mergeFirstChange();
    mergeFirstChange();
    mergeFirstChange();

    for (let index = 0; index < 3; index++) {
      await flush();
      expect(pending).toHaveLength(index + 1);
      pending[index].resolve();
    }
    await flush();

    expect(maxActive).toBe(1);
    expect(append).toHaveBeenCalledTimes(3);
    const afterTexts = append.mock.calls.map((call) => call[7]);
    expect(append.mock.calls[1][5]).toBe(afterTexts[0]);
    expect(append.mock.calls[2][5]).toBe(afterTexts[1]);
  });

  it("waits for a pending merge before undoing", async () => {
    const order: Array<string> = [];
    const step = deferred<void>();
    vi.spyOn(HistoryService, "appendMergeStepAsync").mockImplementation(() => step.promise.then(() => { order.push("append"); }));
    vi.spyOn(HistoryService, "undoMergeStepAsync").mockImplementation(async () => {
      order.push("undo");
      return { originalText: LEFT, modifiedText: RIGHT, stepCount: 1, stepCursor: 0 };
    });
    compareInputs();

    mergeFirstChange();
    const undo = useEditorStore.getState().undoMergeStep(defaultSettings);
    await flush();
    expect(order).toEqual([]);

    step.resolve();
    await expect(undo).resolves.toBe("applied");
    expect(order).toEqual(["append", "undo"]);
    expect(useEditorStore.getState().rightText).toBe(RIGHT);
  });

  it("adds a merge made right after comparing to the comparison's session", async () => {
    const append = vi.spyOn(HistoryService, "appendMergeStepAsync").mockResolvedValue();
    const session = deferred<string>();
    useEditorStore.setState({ historySessionId: "previous-session" });
    compareInputs();
    const tracked = useEditorStore.getState().trackHistorySession(session.promise);

    mergeFirstChange();
    await flush();
    expect(append).not.toHaveBeenCalled();

    session.resolve("compare-session");
    await tracked;
    await flush();

    expect(HistoryService.createMergeSessionAsync).not.toHaveBeenCalled();
    expect(append).toHaveBeenCalledTimes(1);
    expect(append.mock.calls[0][0]).toBe("compare-session");
    expect(useEditorStore.getState().historySessionId).toBe("compare-session");
  });

  it("tells the user when a merge could not be saved because storage is full", async () => {
    vi.spyOn(HistoryService, "appendMergeStepAsync").mockRejectedValue(Object.assign(new Error("quota"), { name: "QuotaExceededError" }));
    compareInputs();

    mergeFirstChange();
    await flush();
    await flush();

    const [toast] = useToastStore.getState().activeToasts;
    expect(toast).toMatchObject({ tone: "error" });
    expect(toast.message).toContain("storage is full");

    const retry = vi.spyOn(HistoryService, "appendMergeStepAsync").mockResolvedValue();
    mergeFirstChange();
    await flush();
    await flush();
    expect(retry).toHaveBeenCalledTimes(2);
    expect(useToastStore.getState().activeToasts).toHaveLength(1);
  });
});
