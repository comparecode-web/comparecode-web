import { useEditorStore } from "@/store/useEditorStore";
import { useEditorUIStore } from "@/store/useEditorUIStore";
import { HistoryService } from "@/services/historyService";
import { CompareSettings } from "@/types/settings";
import { BlockType } from "@/types/diff";

export function useCompareActions() {
  const executeCompare = async (settings: CompareSettings, saveToHistory: boolean, preserveInputState: boolean = false) => {
    const { leftText, rightText, compare } = useEditorStore.getState();
    const { setIsInputExpanded, setIsComparing, isInputExpanded } = useEditorUIStore.getState();

    setIsComparing(true);
    compare(settings);
    setIsInputExpanded(preserveInputState ? isInputExpanded : false);
    setIsComparing(false);

    if (saveToHistory && (leftText || rightText)) {
      await HistoryService.addAsync(leftText, rightText);
    }
  };

  const executeClear = () => {
    const { clearContent } = useEditorStore.getState();
    const { setIsInputExpanded } = useEditorUIStore.getState();

    clearContent();
    setIsInputExpanded(true);
  };

  const executeSwap = async (settings: CompareSettings) => {
    const { swapTexts, currentBlockIndex, selectBlock } = useEditorStore.getState();
    const prevIndex = currentBlockIndex;

    swapTexts();
    await executeCompare(settings, true, true);

    if (prevIndex > 0) {
      const { comparisonResult } = useEditorStore.getState();
      
      if (comparisonResult) {
        const selectableBlocks = comparisonResult.blocks.filter(b => b.kind !== BlockType.Unchanged && !(settings.ignoreWhitespace && b.isWhitespaceChange));
        
        if (prevIndex <= selectableBlocks.length) {
          selectBlock(selectableBlocks[prevIndex - 1].id);
        }
      }
    }
  };

  return { executeCompare, executeClear, executeSwap };
}