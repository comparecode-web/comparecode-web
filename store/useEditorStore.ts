import { create } from "zustand";
import { ComparisonResult, ChangeBlock, BlockType } from "@/types/diff";
import { CompareSettings } from "@/types/settings";
import { MergeDirection } from "@/types/ui";
import { ComparisonService } from "@/services/comparisonService";
import { MergeService } from "@/services/mergeService";
import { useSettingsStore } from "@/store/useSettingsStore";

interface EditorState {
  leftText: string;
  rightText: string;
  comparisonResult: ComparisonResult | null;
  totalSelectableBlocks: number;
  currentBlockIndex: number;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  swapTexts: () => void;
  clearContent: () => void;
  compare: (settings: CompareSettings) => void;
  selectBlock: (blockId: string | null) => void;
  mergeBlock: (block: ChangeBlock, direction: MergeDirection, settings: CompareSettings) => void;
  loadFromHistory: (left: string, right: string, settings: CompareSettings) => void;
  jumpToNextBlock: () => void;
  jumpToPreviousBlock: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  leftText: "",
  rightText: "",
  comparisonResult: null,
  totalSelectableBlocks: 0,
  currentBlockIndex: 0,

  setLeftText: (text: string) => set({ leftText: text }),

  setRightText: (text: string) => set({ rightText: text }),

  swapTexts: () => {
    const { leftText, rightText } = get();
    set({ leftText: rightText, rightText: leftText });
  },

  clearContent: () => {
    set({
      leftText: "",
      rightText: "",
      comparisonResult: null,
      totalSelectableBlocks: 0,
      currentBlockIndex: 0
    });
  },

  compare: (settings: CompareSettings) => {
    const { leftText, rightText } = get();
    const result = ComparisonService.compare(leftText, rightText, settings);
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
    const { leftText, rightText } = get();
    let newLeft = leftText;
    let newRight = rightText;

    if (direction === MergeDirection.LeftToRight) {
      newRight = MergeService.mergeBlock(rightText, block, direction);
    } else {
      newLeft = MergeService.mergeBlock(leftText, block, direction);
    }

    set({ leftText: newLeft, rightText: newRight });
    get().compare(settings);
  },

  loadFromHistory: (left: string, right: string, settings: CompareSettings) => {
    set({ leftText: left, rightText: right });
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

    get().selectBlock(selectableBlocks[nextIndex].id);
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

    get().selectBlock(selectableBlocks[prevIndex].id);
  }
}));