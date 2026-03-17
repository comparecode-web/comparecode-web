import { useEditorStore } from "@/store/useEditorStore";
import { useEditorUIStore } from "@/store/useEditorUIStore";
import { HistoryService } from "@/services/historyService";
import { CompareSettings } from "@/types/settings";

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
    const { swapTexts } = useEditorStore.getState();
    
    swapTexts();
    await executeCompare(settings, true, true);
  };

  return { executeCompare, executeClear, executeSwap };
}