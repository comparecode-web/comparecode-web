"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { DiffHistoryItem } from "@/types/history";

export const HISTORY_MOTIONS = [
  { value: "fade", label: "Quiet fade", description: "Cards fade between positions without sliding." },
  { value: "slide", label: "Soft slide", description: "Follow each card smoothly to its new position." },
  { value: "cascade", label: "Cascade", description: "Cards arrive in a gentle sequence." },
  { value: "scale", label: "Soft zoom", description: "Cards grow into place with a soft fade." },
  { value: "spring", label: "Gentle spring", description: "A playful, lightly elastic movement." }
] as const;
export type HistoryMotion = typeof HISTORY_MOTIONS[number]["value"];
export const DEFAULT_HISTORY_MOTION: HistoryMotion = "spring";

export function AnimatedHistoryList({ items, motion = DEFAULT_HISTORY_MOTION, children, empty, playbackRate = 1, replayKey = 0 }: {
  items: DiffHistoryItem[];
  motion?: HistoryMotion;
  children: (item: DiffHistoryItem) => ReactNode;
  empty?: ReactNode;
  playbackRate?: number;
  replayKey?: number;
}) {
  const root = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const animations = useRef(new Set<Animation>());
  const previousPlayback = useRef({ motion, replayKey });
  const [previousItems, setPreviousItems] = useState(items);
  const [rows, setRows] = useState(items);
  if (previousItems !== items) {
    setPreviousItems(items);
    const ids = new Set(items.map(item => item.id));
    setRows([...items, ...rows.filter(item => !ids.has(item.id))]);
  }

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return;
    const replay = previousPlayback.current.motion !== motion || previousPlayback.current.replayKey !== replayKey;
    previousPlayback.current = { motion, replayKey };
    const active = new Set(items.map(item => item.id));
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true;
    const nextPositions = new Map<string, { x: number; y: number }>();
    animations.current.forEach(animation => animation.cancel());
    animations.current.clear();
    Array.from(container.children).forEach((child, index) => {
      const element = child as HTMLElement;
      const id = element.dataset.historyId!;
      if (!id) return;
      const old = positions.current.get(id);
      const leaving = !active.has(id);
      const returning = element.inert && !leaving;
      const remove = () => setRows(current => current.filter(item => item.id !== id || active.has(id)));
      element.style.opacity = leaving ? "0" : "";
      if (leaving) {
        element.style.position = "absolute";
        element.style.top = `${old?.y ?? 0}px`;
        element.style.left = `${old?.x ?? 0}px`;
        element.style.width = "100%";
        element.inert = true;
      } else {
        element.style.position = "";
        element.style.top = "";
        element.style.left = "";
        element.style.width = "";
        element.inert = false;
      }
      const position = { x: element.offsetLeft, y: element.offsetTop };
      nextPositions.set(id, leaving && old ? old : position);
      if (reduced || !element.animate) { if (leaving) remove(); return; }
      const moving = old && (old.x !== position.x || old.y !== position.y);
      if (old && !moving && !leaving && !replay && !returning) return;
      const entering = !old || replay || returning;
      const displacement = old ? `translate(${old.x - position.x}px, ${old.y - position.y}px)` : "none";
      const entrance = motion === "fade" ? "none" : motion === "scale" ? "scale(.9)" : motion === "cascade" ? "translateX(28px)" : "translateY(24px)";
      const fromTransform = entering ? entrance : motion === "fade" ? "none" : motion === "scale" ? `${displacement} scale(.94)` : displacement;
      const frames: Keyframe[] = leaving
        ? [{ opacity: 1, transform: "none" }, { opacity: 0, transform: entrance }]
        : [{ opacity: entering ? 0 : motion === "fade" ? .2 : 1, transform: fromTransform }, { opacity: 1, transform: "none" }];
      const animation = element.animate(frames, {
        duration: motion === "spring" ? 560 : 380,
        delay: motion === "cascade" && !leaving ? Math.min(index, 7) * 90 : 0,
        easing: motion === "spring" ? "cubic-bezier(.2,1.4,.35,1)" : "cubic-bezier(.2,.7,.2,1)",
        fill: leaving ? "both" : "backwards"
      });
      animation.playbackRate = playbackRate;
      animations.current.add(animation);
      animation.onfinish = () => {
        animations.current.delete(animation);
        if (leaving) {
          remove();
          animation.cancel();
        }
      };
    });
    positions.current = nextPositions;
  }, [items, motion, playbackRate, replayKey]);

  useLayoutEffect(() => {
    const running = animations.current;
    return () => { running.forEach(animation => animation.cancel()); running.clear(); };
  }, []);

  return <div ref={root} className="relative flex w-full flex-col gap-3">
    {rows.length === 0 ? empty : rows.map(item => <div key={item.id} data-history-id={item.id} className="min-w-0">{children(item)}</div>)}
  </div>;
}
