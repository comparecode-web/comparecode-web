"use client";

import { useMemo } from "react";
import { BlockType, ChangeBlock } from "@/types/diff";
import { calculateMinimapSegments } from "@/utils/diffHelpers";
import clsx from "clsx";

interface DiffMinimapProps {
  blocks: Array<ChangeBlock>;
  ignoreWhitespace: boolean;
  onSegmentClick: (blockId: string, offsetPct: number) => void;
}

export function DiffMinimap({ blocks, ignoreWhitespace, onSegmentClick }: DiffMinimapProps) {
  const segments = useMemo(() => {
    return calculateMinimapSegments(blocks, ignoreWhitespace);
  }, [blocks, ignoreWhitespace]);

  const getLeftColor = (kind: BlockType, isSelected: boolean) => {
    if (kind === BlockType.Removed || kind === BlockType.Modified) return isSelected ? "bg-minimap-removed-selected" : "bg-minimap-removed";
    if (kind === BlockType.Added) return isSelected ? "bg-minimap-empty-selected" : "bg-minimap-empty";
    return "bg-transparent";
  };

  const getRightColor = (kind: BlockType, isSelected: boolean) => {
    if (kind === BlockType.Added || kind === BlockType.Modified) return isSelected ? "bg-minimap-added-selected" : "bg-minimap-added";
    if (kind === BlockType.Removed) return isSelected ? "bg-minimap-empty-selected" : "bg-minimap-empty";
    return "bg-transparent";
  };

  return (
    <div className="h-full w-4 shrink-0 bg-transparent relative cursor-default mx-1">
      {segments.map((seg) => (
        <div
          key={seg.id}
          onClick={(e) => {
            e.stopPropagation();
            onSegmentClick(seg.id, seg.offsetPct);
          }}
          className={clsx(
            "absolute w-full flex transition duration-[var(--duration-short)] cursor-pointer rounded-sm overflow-hidden",
            seg.isSelected 
              ? "opacity-100 z-50" 
              : "opacity-70 hover:opacity-100 z-40"
          )}
          style={{ top: `${seg.offsetPct}%`, height: `${seg.heightPct}%` }}
        >
          <div className={clsx("flex-1 transition-colors duration-[var(--duration-short)]", getLeftColor(seg.kind, seg.isSelected || false))} />
          <div className={clsx("flex-1 transition-colors duration-[var(--duration-short)]", getRightColor(seg.kind, seg.isSelected || false))} />
        </div>
      ))}
    </div>
  );
}