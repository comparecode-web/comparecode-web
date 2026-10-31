import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { reportHistoryWriteError } from "@/store/reportHistoryWriteError";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { HistoryService } from "@/services/historyService";
import { CompareSettings } from "@/types/settings";
import { BlockType } from "@/features/compare/text/types/diff";

export function useTextCompareActions() {
  const executeCompare = async (settings: CompareSettings, saveToHistory: boolean, preserveInputState: boolean = false) => {
    const { leftText, rightText, compare, trackHistorySession, bumpHistoryRefreshKey } = useEditorStore.getState();
    const { setIsInputExpanded, setIsComparing, isInputExpanded, resetUnchangedExpansions, setIsLiveUpdatePaused } = useEditorUIStore.getState();

    resetUnchangedExpansions();
    setIsLiveUpdatePaused(false);
    setIsComparing(true);
    await compare(settings);
    setIsInputExpanded(preserveInputState ? isInputExpanded : false);
    setIsComparing(false);

    if (saveToHistory && (leftText || rightText)) {
      useEditorStore.getState().markHistorySnapshot(leftText, rightText);
      try {
        await trackHistorySession(HistoryService.addAsync(leftText, rightText));
        bumpHistoryRefreshKey();
      } catch (error) {
        reportHistoryWriteError(error);
      }
    }
  };

  const executeClear = () => {
    const { clearContent } = useEditorStore.getState();
    const { setIsInputExpanded } = useEditorUIStore.getState();

    clearContent();
    setIsInputExpanded(true);
  };

  const executeSwap = async (settings: CompareSettings) => {
    const { swapTexts, currentBlockIndex, selectBlock, leftText, rightText, queueHistoryWrite, bumpHistoryRefreshKey, prepareManualEdit, writeManualEdit } = useEditorStore.getState();
    const prevIndex = currentBlockIndex;
    const beforeLeft = leftText;
    const beforeRight = rightText;
    const manualEdit = prepareManualEdit({ left: rightText, right: leftText });

    swapTexts();
    const { leftText: afterLeft, rightText: afterRight } = useEditorStore.getState();

    await queueHistoryWrite(async () => {
      const { historySessionId, setHistorySessionId } = useEditorStore.getState();
      let sessionId = historySessionId;
      if (!sessionId) {
        sessionId = await HistoryService.createMergeSessionAsync(beforeLeft, beforeRight);
        setHistorySessionId(sessionId);
      } else {
        await writeManualEdit(sessionId, manualEdit);
      }

      await HistoryService.appendSwapStepAsync(sessionId, beforeLeft, beforeRight, afterLeft, afterRight);
      bumpHistoryRefreshKey();
    }).catch(reportHistoryWriteError);

    await executeCompare(settings, false, true);

    if (prevIndex > 0) {
      const { comparisonResult } = useEditorStore.getState();

      if (comparisonResult) {
        const selectableBlocks = comparisonResult.blocks.filter(b => b.kind !== BlockType.Unchanged);

        if (prevIndex <= selectableBlocks.length) {
          selectBlock(selectableBlocks[prevIndex - 1].id);
        }
      }
    }
  };

  return { executeCompare, executeClear, executeSwap };
}

export const useCompareActions = useTextCompareActions;

