import { useCallback } from "react";
import { DiffHistoryItem } from "@/types/history";
import { useImageStore } from "@/features/compare/image/store/useImageStore";

export function useImageHistoryRestore() {
  const setPendingHistoryRestore = useImageStore((state) => state.setPendingHistoryRestore);

  const restoreImageHistoryItem = useCallback((item: DiffHistoryItem): boolean => {
    if (item.snapshot?.mode !== "image") {
      return false;
    }

    setPendingHistoryRestore({
      sessionId: item.id,
      originalImageUrl: item.snapshot.originalImageUrl,
      modifiedImageUrl: item.snapshot.modifiedImageUrl
    });

    return true;
  }, [setPendingHistoryRestore]);

  return { restoreImageHistoryItem };
}
