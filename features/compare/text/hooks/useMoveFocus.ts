import { useState } from "react";
import { ChangeBlock, ComparisonResult } from "@/features/compare/text/types/diff";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";

export function useMoveFocus(result: ComparisonResult | null) {
  const [focus, setFocus] = useState<{ result: ComparisonResult | null; moveId: string | null }>({
    result: null,
    moveId: null,
  });
  const activeMoveId = focus.result === result ? focus.moveId : null;

  const activateMove = (block: ChangeBlock) => {
    if (!block.move || !result) return;
    const store = useEditorStore.getState();
    store.selectBlock(null);
    setFocus({ result: useEditorStore.getState().comparisonResult, moveId: block.move.id });
    const counterpartId = block.move.counterpartBlockId;
    requestAnimationFrame(() => useEditorStore.getState().scrollToBlock(counterpartId));
  };

  return { activeMoveId, activateMove };
}
