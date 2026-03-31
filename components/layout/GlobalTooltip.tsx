"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type TooltipState = {
  target: HTMLElement;
  text: string;
  anchorRect: DOMRect;
};

const TOOLTIP_SELECTOR = "[data-tooltip],[title]";

function findTooltipTarget(eventTarget: EventTarget | null): HTMLElement | null {
  if (!(eventTarget instanceof Element)) {
    return null;
  }

  return eventTarget.closest<HTMLElement>(TOOLTIP_SELECTOR);
}

function resolveTooltipText(target: HTMLElement): string {
  const dataTooltip = target.getAttribute("data-tooltip")?.trim();
  if (dataTooltip) {
    return dataTooltip;
  }

  const nativeTitle = target.getAttribute("title")?.trim();
  if (nativeTitle) {
    target.setAttribute("data-tooltip", nativeTitle);
    target.removeAttribute("title");
    return nativeTitle;
  }

  return "";
}

export function GlobalTooltip() {
  const [activeTooltip, setActiveTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const isVisible = useMemo(() => {
    return Boolean(activeTooltip?.text);
  }, [activeTooltip]);

  const positionTooltip = useCallback(() => {
    if (!activeTooltip || !tooltipRef.current) {
      return;
    }

    const tooltipElement = tooltipRef.current;
    const tooltipRect = tooltipElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const edgePadding = 8;
    const gap = 10;
    const anchor = activeTooltip.anchorRect;

    const unclampedLeft = anchor.left + anchor.width / 2 - tooltipRect.width / 2;
    const left = Math.max(
      edgePadding,
      Math.min(viewportWidth - tooltipRect.width - edgePadding, unclampedLeft)
    );

    let top = anchor.top - tooltipRect.height - gap;
    let placement: "top" | "bottom" = "top";

    if (top < edgePadding) {
      placement = "bottom";
      top = anchor.bottom + gap;
    }

    if (top + tooltipRect.height > viewportHeight - edgePadding) {
      const fallbackTop = anchor.top - tooltipRect.height - gap;
      if (fallbackTop >= edgePadding) {
        placement = "top";
        top = fallbackTop;
      } else {
        top = Math.max(
          edgePadding,
          Math.min(viewportHeight - tooltipRect.height - edgePadding, top)
        );
      }
    }

    tooltipElement.style.left = `${left}px`;
    tooltipElement.style.top = `${top}px`;
    tooltipElement.dataset.placement = placement;
  }, [activeTooltip]);

  useEffect(() => {
    function showTooltip(target: HTMLElement) {
      const text = resolveTooltipText(target);
      if (!text) {
        setActiveTooltip(null);
        return;
      }

      setActiveTooltip({
        target,
        text,
        anchorRect: target.getBoundingClientRect(),
      });
    }

    function hideTooltip() {
      setActiveTooltip(null);
    }

    function handleMouseOver(event: MouseEvent) {
      const target = findTooltipTarget(event.target);
      if (!target) {
        return;
      }

      showTooltip(target);
    }

    function handleMouseOut(event: MouseEvent) {
      const relatedTarget = event.relatedTarget;
      const nextTarget = findTooltipTarget(relatedTarget);
      if (nextTarget) {
        showTooltip(nextTarget);
        return;
      }

      hideTooltip();
    }

    function handleFocusIn(event: FocusEvent) {
      const target = findTooltipTarget(event.target);
      if (!target) {
        return;
      }

      showTooltip(target);
    }

    function handleFocusOut(event: FocusEvent) {
      const nextTarget = findTooltipTarget(event.relatedTarget);
      if (nextTarget) {
        showTooltip(nextTarget);
        return;
      }

      hideTooltip();
    }

    function handlePointerDown() {
      hideTooltip();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        hideTooltip();
      }
    }

    function updateTooltipPosition() {
      setActiveTooltip((current) => {
        if (!current || !current.target.isConnected) {
          return null;
        }

        return {
          ...current,
          anchorRect: current.target.getBoundingClientRect(),
        };
      });
    }

    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("scroll", updateTooltipPosition, true);
    window.addEventListener("resize", updateTooltipPosition);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("mouseout", handleMouseOut, true);
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("scroll", updateTooltipPosition, true);
      window.removeEventListener("resize", updateTooltipPosition);
    };
  }, []);

  useLayoutEffect(() => {
    positionTooltip();
  }, [positionTooltip]);

  if (!isVisible || !activeTooltip || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      id="cc-global-tooltip"
      role="tooltip"
      ref={tooltipRef}
      className="cc-global-tooltip"
      style={{ left: "8px", top: "8px" }}
    >
      {activeTooltip.text}
    </div>,
    document.body
  );
}