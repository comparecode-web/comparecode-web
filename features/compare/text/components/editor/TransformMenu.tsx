"use client";

import { useRef, useState } from "react";
import { MdAutoFixHigh, MdCheck } from "react-icons/md";
import { IconButton } from "@/components/ui/IconButton";
import { MenuItem, PopoverMenu } from "@/components/ui/PopoverMenu";
import { TEXT_TRANSFORMS, TextTransformId } from "@/features/compare/text/services/transforms/textTransforms";
import type { TransformRun, TransformSide, TransformTarget } from "@/features/compare/text/hooks/useTextTransforms";
import { formatJson, minifyJson, sortJsonKeys } from "@/features/compare/text/services/transforms/jsonFormat";

export interface TransformOption {
  id: string;
  label: string;
  run: TransformRun;
}

const textOption = (id: TextTransformId, label: string): TransformOption => ({ id, label, run: TEXT_TRANSFORMS[id] });

export const TRANSFORM_GROUPS: TransformOption[][] = [[
  textOption("lowercase", "Lowercase"),
  textOption("sort-lines", "Sort lines"),
  textOption("join-lines", "Replace line breaks with spaces"),
  textOption("trim-whitespace", "Trim whitespace")
], [
  { id: "json-2", label: "Format JSON (2 spaces)", run: (text) => formatJson(text, "2") },
  { id: "json-4", label: "Format JSON (4 spaces)", run: (text) => formatJson(text, "4") },
  { id: "json-tab", label: "Format JSON (tabs)", run: (text) => formatJson(text, "tab") },
  { id: "json-minify", label: "Minify JSON", run: minifyJson },
  { id: "json-sort", label: "Sort JSON keys", run: sortJsonKeys }
]];

interface TransformMenuProps {
  side: TransformSide;
  label: string;
  disabled?: boolean;
  onTransform: (target: TransformTarget, run: TransformRun) => void;
  className?: string;
}

export function TransformMenu({ side, label, disabled = false, onTransform, className }: TransformMenuProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [applyToBoth, setApplyToBoth] = useState(false);

  return (
    <div className={className}>
      <IconButton ref={triggerRef} size="sm" aria-label={`Transform ${label.toLowerCase()} text`} title="Transform"
        aria-haspopup="menu" aria-expanded={isOpen} disabled={disabled} onClick={() => setIsOpen((open) => !open)}>
        <MdAutoFixHigh />
      </IconButton>
      <PopoverMenu isOpen={isOpen} onOpenChange={setIsOpen} triggerRef={triggerRef} align="end" className="min-w-60 overflow-hidden py-1">
        {TRANSFORM_GROUPS.map((group, index) => (
          <div key={index} className={index ? "mt-1 border-t border-border-default pt-1" : undefined}>
            {group.map((option) => (
              <MenuItem key={option.id} onClick={() => {
                setIsOpen(false);
                onTransform(applyToBoth ? "both" : side, option.run);
              }}>
                {option.label}
              </MenuItem>
            ))}
          </div>
        ))}
        <div className="mt-1 border-t border-border-default pt-1">
          <MenuItem isSelected={applyToBoth} aria-label={`Apply to both sides, ${applyToBoth ? "on" : "off"}`} onClick={() => setApplyToBoth((value) => !value)}>
            <span className="flex size-4 shrink-0 items-center justify-center">{applyToBoth && <MdCheck />}</span>
            Apply to both sides
          </MenuItem>
        </div>
      </PopoverMenu>
    </div>
  );
}
