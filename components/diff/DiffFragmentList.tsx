import { memo } from "react";
import { TextFragment } from "@/types/diff";
import { getFragmentColorClass, getFragmentRoundingClass } from "@/utils/diffHelpers";
import { cn } from "@/utils/uiHelpers";

interface DiffFragmentListProps {
  fragments: Array<TextFragment>;
  ignoreWhitespace: boolean;
}

export const DiffFragmentList = memo(({ fragments, ignoreWhitespace }: DiffFragmentListProps) => {
  if (!fragments || fragments.length === 0) {
    return <span className="select-none opacity-0 inline-block w-0">{"\u200B"}</span>;
  }

  return (
    <>
      {fragments.map((frag, fIdx, arr) => (
        <span
          key={fIdx}
          className={cn(
            getFragmentColorClass(frag.kind, frag.isWhitespaceChange, ignoreWhitespace),
            getFragmentRoundingClass(arr, fIdx, ignoreWhitespace)
          )}
        >
          {frag.text === "" ? (
            <span className="select-none opacity-0 inline-block w-0">{"\u200B"}</span>
          ) : (
            frag.text
          )}
        </span>
      ))}
    </>
  );
});

DiffFragmentList.displayName = "DiffFragmentList";