import { useCallback, useRef, type PointerEvent, type RefObject } from "react";

interface ResizableSplitInput {
  containerRef: RefObject<HTMLDivElement | null>;
  setEditorPaneWidthPercent: (value: number) => void;
}

export function useResizableMarkdownSplit({ containerRef, setEditorPaneWidthPercent }: ResizableSplitInput) {
  const pointerIdRef = useRef<number | null>(null);

  const updateWidth = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const rawPercent = ((clientX - rect.left) / rect.width) * 100;
    setEditorPaneWidthPercent(rawPercent);
  }, [containerRef, setEditorPaneWidthPercent]);

  const onPointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateWidth(event.clientX);
  }, [updateWidth]);

  const onPointerMove = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    updateWidth(event.clientX);
  }, [updateWidth]);

  const onPointerUp = useCallback((event: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const onDoubleClick = useCallback(() => {
    setEditorPaneWidthPercent(50);
  }, [setEditorPaneWidthPercent]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onDoubleClick
  };
}
