import { memo } from "react";
import { DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { getFragmentColorClass, getFragmentRoundingClass } from "@/features/compare/text/utils/diffHelpers";
import { cn } from "@/utils/uiHelpers";
import type { SyntaxLine } from "../../services/syntax/tokenizeSyntax";
import { SyntaxText } from "./SyntaxText";

interface DiffFragmentListProps {
  fragments: Array<TextFragment>;
  lineEndingLabel?: string;
  suppressHighlight?: boolean;
  syntaxLine?: SyntaxLine;
}

export const DiffFragmentList = memo(({ fragments, lineEndingLabel, suppressHighlight = false, syntaxLine }: DiffFragmentListProps) => {
  if ((!fragments || fragments.length === 0) && !lineEndingLabel) {
    return <span className="select-none opacity-0 inline-block w-0">{"\u200B"}</span>;
  }

  const matchingSyntaxLine = syntaxLine && syntaxLine.text === (fragments ?? []).map((fragment) => fragment.text).join("") ? syntaxLine : undefined;
  const fragmentOffsets: number[] = [];
  if (matchingSyntaxLine) {
    let offset = 0;
    for (const fragment of fragments) {
      fragmentOffsets.push(offset);
      offset += fragment.text.length;
    }
  }
  return (
    <>
      {(fragments ?? []).map((frag, fIdx, arr) => (
          <span
            key={fIdx}
            className={cn(
              suppressHighlight ? "bg-transparent text-text-primary" : getFragmentColorClass(frag.kind),
              !suppressHighlight && getFragmentRoundingClass(arr, fIdx)
            )}
          >
            {frag.text === "" ? (
              <span className="select-none opacity-0 inline-block w-0">{"\u200B"}</span>
            ) : (
              matchingSyntaxLine ? <SyntaxText text={frag.text} offset={fragmentOffsets[fIdx]} line={matchingSyntaxLine}
                preserveDiffColor={!suppressHighlight && (frag.kind === DiffChangeType.Inserted || frag.kind === DiffChangeType.Deleted)} /> : frag.text
            )}
          </span>
      ))}
      {lineEndingLabel && <span className="ml-1 rounded bg-bg-secondary px-1 text-[0.75em] text-text-secondary" title="Changed line ending">{lineEndingLabel}</span>}
    </>
  );
});

DiffFragmentList.displayName = "DiffFragmentList";


