import { memo } from "react";
import { TextFragment } from "@/features/compare/text/types/diff";
import { getFragmentColorClass, getFragmentRoundingClass } from "@/features/compare/text/utils/diffHelpers";
import { cn } from "@/utils/uiHelpers";

interface DiffFragmentListProps {
  fragments: Array<TextFragment>;
  lineEndingLabel?: string;
  suppressHighlight?: boolean;
}

export const DiffFragmentList = memo(({ fragments, lineEndingLabel, suppressHighlight = false }: DiffFragmentListProps) => {
  if ((!fragments || fragments.length === 0) && !lineEndingLabel) {
    return <span className="select-none opacity-0 inline-block w-0">{"\u200B"}</span>;
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
            frag.text
          )}
        </span>
      ))}
      {lineEndingLabel && <span className="ml-1 rounded bg-bg-secondary px-1 text-[0.75em] text-text-secondary" title="Changed line ending">{lineEndingLabel}</span>}
    </>
  );
});

DiffFragmentList.displayName = "DiffFragmentList";


