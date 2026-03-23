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

  const getLeftColor = (kind: BlockType) => {
    if (kind === BlockType.Removed || kind === BlockType.Modified) return "bg-minimap-removed";
    if (kind === BlockType.Added) return "bg-minimap-empty";
    return "bg-transparent";
  };

  const getRightColor = (kind: BlockType) => {
    if (kind === BlockType.Added || kind === BlockType.Modified) return "bg-minimap-added";
    if (kind === BlockType.Removed) return "bg-minimap-empty";
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
          className="absolute w-full flex opacity-80 hover:opacity-100 transition-opacity cursor-pointer z-40 rounded-sm overflow-hidden"
          style={{ top: `${seg.offsetPct}%`, height: `${seg.heightPct}%` }}
        >
          <div className={clsx("flex-1", getLeftColor(seg.kind))} />
          <div className={clsx("flex-1", getRightColor(seg.kind))} />
        </div>
      ))}
    </div>
  );
}