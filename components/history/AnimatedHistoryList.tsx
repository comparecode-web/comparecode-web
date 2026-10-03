"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { DiffHistoryItem } from "@/types/history";
import { HISTORY_EASING, historySpringEasing } from "./historyMotion";

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
  const animations = useRef(new Map<HTMLElement, Animation>());
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
    const interrupted = new Map<string, { x: number; y: number; opacity: number }>();
    animations.current.forEach((animation, element) => {
      const old = positions.current.get(element.dataset.historyId!);
      if (!old) return;
      const style = getComputedStyle(element);
      const transform = style.transform && style.transform !== "none" ? new DOMMatrixReadOnly(style.transform) : null;
      interrupted.set(element.dataset.historyId!, {
        x: old.x + (transform?.m41 ?? 0), y: old.y + (transform?.m42 ?? 0), opacity: Number(style.opacity || 1)
      });
    });
    animations.current.forEach(animation => { animation.onfinish = null; animation.cancel(); });
    animations.current.clear();
    const elements = Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement && !!child.dataset.historyId);
    // Restore every row's layout before measuring destinations, including returning exits.
    elements.forEach(element => {
      const id = element.dataset.historyId!;
      const old = positions.current.get(id);
      const leaving = !active.has(id);
      element.style.opacity = leaving ? "0" : "";
      if (leaving) {
        element.style.position = "absolute";
        element.style.top = `${old?.y ?? 0}px`;
        element.style.left = `${old?.x ?? 0}px`;
        element.style.width = "100%";
      } else {
        element.style.position = "";
        element.style.top = "";
        element.style.left = "";
        element.style.width = "";
      }
    });
    const destinations = elements.map(element => ({ x: element.offsetLeft, y: element.offsetTop, height: element.offsetHeight }));
    const listTop = container.getBoundingClientRect().top;
    const removed = new Set<string>();
    elements.forEach((element, index) => {
      const id = element.dataset.historyId!;
      const old = positions.current.get(id);
      const current = interrupted.get(id);
      const source = current ?? old;
      const leaving = !active.has(id);
      const returning = element.inert && !leaving;
      element.inert = leaving;
      const remove = () => setRows(rows => rows.filter(item => item.id !== id || active.has(id)));
      const position = destinations[index];
      nextPositions.set(id, leaving && old ? old : position);
      const sourceY = source?.y ?? position.y;
      const crossesViewport = listTop + Math.max(sourceY, position.y) + position.height >= 0 && listTop + Math.min(sourceY, position.y) <= window.innerHeight;
      if (reduced || !element.animate || !crossesViewport) {
        if (leaving) removed.add(id);
        return;
      }
      const moving = source && (source.x !== position.x || source.y !== position.y);
      if (old && !moving && !leaving && !replay && !returning && !current) return;
      const entering = !old || replay || (returning && !current);
      const x = entering ? 0 : (source?.x ?? position.x) - position.x;
      const y = entering ? 24 : (source?.y ?? position.y) - position.y;
      const displacement = `translate(${x}px, ${y}px)`;
      const entrance = motion === "fade" ? "none" : motion === "scale" ? "scale(.9)" : motion === "cascade" ? "translateX(28px)" : "translateY(24px)";
      const fromTransform = entering ? entrance : motion === "fade" ? "none" : motion === "scale" ? `${displacement} scale(.94)` : displacement;
      const opacity = replay ? 0 : current?.opacity ?? (entering ? 0 : motion === "fade" ? .2 : 1);
      const frames: Keyframe[] = leaving
        ? [{ opacity: current?.opacity ?? 1, transform: displacement }, { opacity: 0, transform: entrance }]
        : [{ opacity, transform: fromTransform }, { opacity: 1, transform: "none" }];
      const animation = element.animate(frames, {
        duration: motion === "spring" ? 560 : 380,
        delay: motion === "cascade" && !leaving ? Math.min(index, 7) * 90 : 0,
        easing: motion === "spring" ? historySpringEasing(Math.hypot(x, leaving ? y - 24 : y)) : HISTORY_EASING,
        fill: leaving ? "both" : "backwards"
      });
      animation.playbackRate = playbackRate;
      animations.current.set(element, animation);
      animation.onfinish = () => {
        if (animations.current.get(element) !== animation) return;
        animation.onfinish = null;
        animations.current.delete(element);
        if (leaving) {
          positions.current.delete(id);
          remove();
          animation.cancel();
        }
      };
    });
    let superseded = false;
    if (removed.size) queueMicrotask(() => {
      if (superseded) return;
      removed.forEach(id => positions.current.delete(id));
      setRows(rows => rows.filter(item => !removed.has(item.id)));
    });
    positions.current = nextPositions;
    return () => { superseded = true; };
  }, [items, motion, playbackRate, replayKey]);

  useLayoutEffect(() => {
    const running = animations.current;
    return () => { running.forEach(animation => { animation.onfinish = null; animation.cancel(); }); running.clear(); };
  }, []);

  return <div ref={root} className="relative flex w-full flex-col gap-3">
    {rows.length === 0 ? empty : rows.map(item => <div key={item.id} data-history-id={item.id} className="min-w-0">{children(item)}</div>)}
  </div>;
}
