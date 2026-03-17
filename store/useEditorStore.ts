import { create } from "zustand";
import { ComparisonResult, ChangeBlock } from "@/types/diff";
import { CompareSettings } from "@/types/settings";
import { MergeDirection } from "@/types/ui";
import { ComparisonService } from "@/services/comparisonService";
import { MergeService } from "@/services/mergeService";

interface EditorState {
  leftText: string;
  rightText: string;
  comparisonResult: ComparisonResult | null;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  swapTexts: () => void;
  clearContent: () => void;
  compare: (settings: CompareSettings) => void;
  selectBlock: (blockId: string | null) => void;
  mergeBlock: (block: ChangeBlock, direction: MergeDirection, settings: CompareSettings) => void;
  loadFromHistory: (left: string, right: string, settings: CompareSettings) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  leftText: "",
  rightText: "",
  comparisonResult: null,

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
      comparisonResult: null
    });
  },

  compare: (settings: CompareSettings) => {
    const { leftText, rightText } = get();
    const result = ComparisonService.compare(leftText, rightText, settings);
    set({
      comparisonResult: result
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

    set({
      comparisonResult: { blocks: updatedBlocks }
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
  }
}));