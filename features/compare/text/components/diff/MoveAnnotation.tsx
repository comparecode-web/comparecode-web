import { ChangeBlock } from "@/features/compare/text/types/diff";
import { useEditorStore } from "@/features/compare/text/store/useTextStore";
import { MdArrowDownward, MdArrowUpward } from "react-icons/md";

export function MoveAnnotation({ block, split = false, onActivate }: {
  block: ChangeBlock;
  split?: boolean;
  onActivate: (block: ChangeBlock) => void;
}) {
  const move = block.move;
  if (!move) return null;
  const blocks = useEditorStore.getState().comparisonResult?.blocks ?? [];
  const currentIndex = blocks.findIndex((item) => item.id === block.id);
  const counterpartIndex = blocks.findIndex((item) => item.id === move.counterpartBlockId);
  const pointsDown = counterpartIndex > currentIndex;
  const label = move.role === "from" ? "Moved to" : "Moved from";
  return (
    <div className="mx-1 flex h-7 items-center">
      <div className={split ? `flex w-1/2 items-center ${move.role === "to" ? "ml-auto justify-start" : "justify-end"}` : "flex items-center"}>
      <button
        type="button"
        className="flex h-6 min-w-0 max-w-full items-center gap-1.5 rounded px-1 text-xs font-semibold text-text-primary hover:bg-hover-overlay focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary"
        title="Jump to the other end of this moved section"
        onClick={(event) => {
          event.stopPropagation();
          onActivate(block);
        }}
      >
        <span className="flex h-5 shrink-0 items-center rounded-sm bg-accent-primary px-1.5 text-white">Move {move.number}</span>
        <span className="min-w-0 truncate">{label} lines {move.counterpartStartLine}–{move.counterpartEndLine}{move.modified ? " · edited" : ""}</span>
        {pointsDown ? <MdArrowDownward aria-hidden="true" /> : <MdArrowUpward aria-hidden="true" />}
      </button>
      </div>
    </div>
  );
}
