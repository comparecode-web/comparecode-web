import { create } from "zustand";
import { ComparisonResult, ChangeBlock, BlockType, DiffChangeType } from "@/features/compare/text/types/diff";
import { CompareSettings } from "@/types/settings";
import { MergeDirection } from "@/types/ui";
import { TextCompareService } from "@/features/compare/text/services/TextCompareService";
import { MergeService } from "@/features/compare/text/services/mergeService";
import { HistoryService } from "@/services/historyService";
import { HistoryActionDirection } from "@/types/history";
import { useSettingsStore } from "@/store/useSettingsStore";
import { scrollToBlockInDOM, scrollToTopInDOM, scrollToBottomInDOM } from "@/features/compare/text/utils/scrollHelpers";

interface EditorState {
  leftText: string;
  rightText: string;
  historySessionId: string | null;
  historyRefreshKey: number;
  comparisonResult: ComparisonResult | null;
  totalSelectableBlocks: number;
  currentBlockIndex: number;
  setHistorySessionId: (sessionId: string | null) => void;
  bumpHistoryRefreshKey: () => void;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  swapTexts: () => void;
  clearContent: () => void;
  compare: (settings: CompareSettings) => void;
  selectBlock: (blockId: string | null) => void;
  mergeBlock: (block: ChangeBlock, direction: MergeDirection, settings: CompareSettings) => void;
  undoMergeStep: (settings: CompareSettings) => Promise<"applied" | "not-available" | "no-session">;
  redoMergeStep: (settings: CompareSettings) => Promise<"applied" | "not-available" | "no-session">;
  loadFromHistory: (left: string, right: string, settings: CompareSettings, sessionId?: string | null) => void;
  jumpToNextBlock: () => void;
  jumpToPreviousBlock: () => void;
  scrollToBlock: (blockId: string) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => {
  let pendingHistorySessionPromise: Promise<string> | null = null;
  let pendingHistorySessionVersion = 0;

  const invalidatePendingHistorySession = () => {
    pendingHistorySessionVersion += 1;
    pendingHistorySessionPromise = null;
  };

  const resolveHistorySessionId = async (beforeLeft: string, beforeRight: string): Promise<string> => {
    const existingSessionId = get().historySessionId;
    if (existingSessionId) {
      return existingSessionId;
    }

    if (pendingHistorySessionPromise) {
      return pendingHistorySessionPromise;
    }

    const requestVersion = pendingHistorySessionVersion;
    const sessionPromise = HistoryService.createMergeSessionAsync(beforeLeft, beforeRight)
      .then((sessionId) => {
        const currentSessionId = get().historySessionId;
        if (requestVersion === pendingHistorySessionVersion && !currentSessionId) {
          set({ historySessionId: sessionId });
          return sessionId;
        }

        return currentSessionId ?? sessionId;
      })
      .finally(() => {
        if (pendingHistorySessionPromise === sessionPromise) {
          pendingHistorySessionPromise = null;
        }
      });

    pendingHistorySessionPromise = sessionPromise;

    return pendingHistorySessionPromise;
  };

  return ({
  leftText: "",
  rightText: "",
  historySessionId: null,
  historyRefreshKey: 0,
  comparisonResult: null,
  totalSelectableBlocks: 0,
  currentBlockIndex: 0,

  setHistorySessionId: (sessionId: string | null) => {
    invalidatePendingHistorySession();
    set({ historySessionId: sessionId });
  },
  bumpHistoryRefreshKey: () => set((state) => ({ historyRefreshKey: state.historyRefreshKey + 1 })),

  setLeftText: (text: string) => set({ leftText: text }),

  setRightText: (text: string) => set({ rightText: text }),

  swapTexts: () => {
    const { leftText, rightText } = get();
    set({ leftText: rightText, rightText: leftText });
  },

  clearContent: () => {
    invalidatePendingHistorySession();
    set({
      leftText: "",
      rightText: "",
      historySessionId: null,
      historyRefreshKey: 0,
      comparisonResult: null,
      totalSelectableBlocks: 0,
      currentBlockIndex: 0
    });
  },

  compare: (settings: CompareSettings) => {
    const { leftText, rightText } = get();
    const result = TextCompareService.compare(leftText, rightText, settings);
    const selectableBlocks = result.blocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));

    set({
      comparisonResult: result,
      totalSelectableBlocks: selectableBlocks.length,
      currentBlockIndex: 0
    });
  },

  selectBlock: (blockId: string | null) => {
    const currentResult = get().comparisonResult;
    if (!currentResult) {
      return;
    }

    const updatedBlocks = currentResult.blocks.map(b => ({
      ...b,
      isSelected: b.id === blockId
    }));
    const settings = useSettingsStore.getState().settings;
    const selectableBlocks = updatedBlocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));
    const currentIndex = blockId ? selectableBlocks.findIndex(b => b.id === blockId) + 1 : 0;
    set({
      comparisonResult: { blocks: updatedBlocks },
      totalSelectableBlocks: selectableBlocks.length,
      currentBlockIndex: currentIndex
    });
  },

  mergeBlock: (block: ChangeBlock, direction: MergeDirection, settings: CompareSettings) => {
    const { leftText, rightText, currentBlockIndex, historySessionId } = get();
    const beforeLeft = leftText;
    const beforeRight = rightText;
    let newLeft = leftText;
    let newRight = rightText;

    if (direction === MergeDirection.LeftToRight) {
      newRight = MergeService.mergeBlock(rightText, block, direction);
    } else {
      newLeft = MergeService.mergeBlock(leftText, block, direction);
    }

    set({ leftText: newLeft, rightText: newRight });

    const persistMergeStep = async (): Promise<void> => {
      const sessionId = historySessionId ?? await resolveHistorySessionId(beforeLeft, beforeRight);

      const stepDirection = direction === MergeDirection.LeftToRight
        ? HistoryActionDirection.LeftToRight
        : HistoryActionDirection.RightToLeft;

      const originalLinesAffected = block.oldLines.filter(l => l.kind !== DiffChangeType.Imaginary).length;
      const modifiedLinesAffected = block.newLines.filter(l => l.kind !== DiffChangeType.Imaginary).length;

      await HistoryService.appendMergeStepAsync(
        sessionId,
        stepDirection,
        originalLinesAffected,
        modifiedLinesAffected,
        beforeLeft,
        beforeRight,
        newLeft,
        newRight,
        block.id,
        block.kind
      );

      get().bumpHistoryRefreshKey();
    };

    void persistMergeStep();

    get().compare(settings);

    const appSettings = useSettingsStore.getState().settings;
    if (appSettings.isContinuousMergeEnabled) {
      const newResult = get().comparisonResult;
      if (newResult) {
        const newSelectableBlocks = newResult.blocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));
        let targetIndex = currentBlockIndex - 1;

        if (targetIndex >= newSelectableBlocks.length) {
          targetIndex = newSelectableBlocks.length - 1;
        }

        if (targetIndex >= 0) {
          const nextBlockId = newSelectableBlocks[targetIndex].id;
          get().selectBlock(nextBlockId);
        }
      }
    }
  },

  undoMergeStep: async (settings: CompareSettings) => {
    let { historySessionId } = get();
    if (!historySessionId && pendingHistorySessionPromise) {
      historySessionId = await pendingHistorySessionPromise;
    }

    if (!historySessionId) {
      return "no-session";
    }

    const snapshot = await HistoryService.undoMergeStepAsync(historySessionId);
    if (!snapshot) {
      return "not-available";
    }

    set({ leftText: snapshot.originalText, rightText: snapshot.modifiedText });
    get().compare(settings);
    get().selectBlock(null);
    get().bumpHistoryRefreshKey();
    return "applied";
  },

  redoMergeStep: async (settings: CompareSettings) => {
    let { historySessionId } = get();
    if (!historySessionId && pendingHistorySessionPromise) {
      historySessionId = await pendingHistorySessionPromise;
    }

    if (!historySessionId) {
      return "no-session";
    }

    const snapshot = await HistoryService.redoMergeStepAsync(historySessionId);
    if (!snapshot) {
      return "not-available";
    }

    set({ leftText: snapshot.originalText, rightText: snapshot.modifiedText });
    get().compare(settings);
    get().selectBlock(null);
    get().bumpHistoryRefreshKey();
    return "applied";
  },

  loadFromHistory: (left: string, right: string, settings: CompareSettings, sessionId: string | null = null) => {
    invalidatePendingHistorySession();
    set({ leftText: left, rightText: right, historySessionId: sessionId });
    get().compare(settings);
  },

  jumpToNextBlock: () => {
    const currentResult = get().comparisonResult;
    if (!currentResult) {
      return;
    }

    const settings = useSettingsStore.getState().settings;
    const selectableBlocks = currentResult.blocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));
    if (selectableBlocks.length === 0) {
      return;
    }

    const selectedBlock = currentResult.blocks.find(b => b.isSelected);
    let nextIndex = 0;
    if (selectedBlock) {
      const currentIndex = selectableBlocks.findIndex(b => b.id === selectedBlock.id);
      if (currentIndex >= 0 && currentIndex < selectableBlocks.length - 1) {
        nextIndex = currentIndex + 1;
      }
    }

    const nextBlockId = selectableBlocks[nextIndex].id;
    get().selectBlock(nextBlockId);

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          get().scrollToBlock(nextBlockId);
        });
      });
      return;
    }

    get().scrollToBlock(nextBlockId);
  },

  jumpToPreviousBlock: () => {
    const currentResult = get().comparisonResult;
    if (!currentResult) {
      return;
    }

    const settings = useSettingsStore.getState().settings;
    const selectableBlocks = currentResult.blocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));
    if (selectableBlocks.length === 0) {
      return;
    }

    const selectedBlock = currentResult.blocks.find(b => b.isSelected);
    let prevIndex = selectableBlocks.length - 1;
    if (selectedBlock) {
      const currentIndex = selectableBlocks.findIndex(b => b.id === selectedBlock.id);
      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      }
    }

    const prevBlockId = selectableBlocks[prevIndex].id;
    get().selectBlock(prevBlockId);

    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          get().scrollToBlock(prevBlockId);
        });
      });
      return;
    }

    get().scrollToBlock(prevBlockId);
  },

  scrollToBlock: (blockId: string) => {
    const currentResult = get().comparisonResult;
    scrollToBlockInDOM(currentResult, blockId);
  },

  scrollToTop: () => {
    scrollToTopInDOM();
  },

  scrollToBottom: () => {
    scrollToBottomInDOM();
  }
  });
});

export const useTextStore = useEditorStore;

