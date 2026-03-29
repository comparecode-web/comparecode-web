import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { useEditorUIStore } from "@/features/compare/text/store/useTextUIStore";
import { HistoryService } from "@/services/historyService";
import { CompareSettings } from "@/types/settings";
import { BlockType } from "@/features/compare/text/types/diff";

export function useCompareActions() {
	const executeCompare = async (settings: CompareSettings, saveToHistory: boolean, preserveInputState: boolean = false) => {
		const { leftText, rightText, compare, setHistorySessionId, bumpHistoryRefreshKey } = useEditorStore.getState();
		const { setIsInputExpanded, setIsComparing, isInputExpanded } = useEditorUIStore.getState();

		setIsComparing(true);
		compare(settings);
		setIsInputExpanded(preserveInputState ? isInputExpanded : false);
		setIsComparing(false);

		if (saveToHistory && (leftText || rightText)) {
			const sessionId = await HistoryService.addAsync(leftText, rightText);
			setHistorySessionId(sessionId);
			bumpHistoryRefreshKey();
		}
	};

	const executeClear = () => {
		const { clearContent } = useEditorStore.getState();
		const { setIsInputExpanded } = useEditorUIStore.getState();

		clearContent();
		setIsInputExpanded(true);
	};

	const executeSwap = async (settings: CompareSettings) => {
		const { swapTexts, currentBlockIndex, selectBlock, leftText, rightText, historySessionId, setHistorySessionId, bumpHistoryRefreshKey } = useEditorStore.getState();
		const prevIndex = currentBlockIndex;
		const beforeLeft = leftText;
		const beforeRight = rightText;

		swapTexts();
		const { leftText: afterLeft, rightText: afterRight } = useEditorStore.getState();

		let sessionId = historySessionId;
		if (!sessionId) {
			sessionId = await HistoryService.createMergeSessionAsync(beforeLeft, beforeRight);
			setHistorySessionId(sessionId);
		}

		await HistoryService.appendSwapStepAsync(sessionId, beforeLeft, beforeRight, afterLeft, afterRight);
		bumpHistoryRefreshKey();

		await executeCompare(settings, false, true);

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

export const useTextCompareActions = useCompareActions;

