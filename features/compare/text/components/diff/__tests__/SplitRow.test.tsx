import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VirtualItem } from "@tanstack/react-virtual";
import { defaultSettings } from "@/config/defaults";
import { BlockType, ChangeBlock, DiffChangeType } from "@/features/compare/text/types/diff";
import { getHoveredBlockSurface } from "@/features/compare/text/utils/diffSurfaces";
import { SplitRow, SplitRowData, getSplitCellBackground } from "../SplitRow";

const virtualRow = { index: 0, start: 0 } as VirtualItem;

function block(id: string, kind: BlockType): ChangeBlock {
  return {
    id, kind, oldLines: [], newLines: [], startIndexOld: 0, startIndexNew: 0,
    startOffsetOld: 0, endOffsetOld: 0, startOffsetNew: 0, endOffsetNew: 0,
    removalCount: 0, additionCount: 0
  };
}

function lineRow(change: ChangeBlock): SplitRowData {
  return {
    id: `${change.id}-line`, type: "line", block: change, oldIndex: 0, newIndex: 0,
    isFirst: true, isLast: true, isSelectable: true, isFirstLine: true, isLastLine: true
  };
}

function renderLine(change: ChangeBlock) {
  return render(<SplitRow row={lineRow(change)} virtualRow={virtualRow} settings={defaultSettings}
    selectedBlockId={null} activeMoveId={null}
    onActivateMove={vi.fn()} setHoveredBlockId={vi.fn()} selectBlock={vi.fn()}
    mergeBlock={vi.fn()} selectionSide={null} setSelectionSide={vi.fn()} measureRef={vi.fn()} />);
}

describe("split diff row", () => {
  it("keeps ignored blank lines tinted inside an added block", () => {
    const change = block("added", BlockType.Added);
    change.newLines = [{ lineNumber: 1, kind: DiffChangeType.Unchanged,
      fragments: [{ kind: DiffChangeType.Unchanged, text: "" }] }];
    expect(getSplitCellBackground(lineRow(change), "new")).toBe("bg-diff-added-bg");
    expect(getSplitCellBackground(lineRow(change), "old")).toBe("bg-diff-empty-bg");
  });

  it("hovers only the active moved block across both panes", () => {
    const source = block("source", BlockType.Removed);
    source.oldLines = [{ lineNumber: 1, kind: DiffChangeType.Deleted,
      fragments: [{ kind: DiffChangeType.Unchanged, text: "Moved text" }] }];
    source.move = { id: "move", role: "from", counterpartStartLine: 3,
      counterpartEndLine: 3, counterpartBlockId: "target", modified: false };
    const target = block("target", BlockType.Added);
    target.newLines = [{ lineNumber: 3, kind: DiffChangeType.Inserted,
      fragments: [{ kind: DiffChangeType.Unchanged, text: "Moved text" }] }];
    target.move = { id: "move", role: "to", counterpartStartLine: 1,
      counterpartEndLine: 1, counterpartBlockId: "source", modified: false };

    expect(getHoveredBlockSurface(lineRow(source), source.id)).toMatchObject({ className: "bg-hover-overlay", roundedTop: true, roundedBottom: true });
    expect(getHoveredBlockSurface(lineRow(target), source.id)).toBeNull();
  });

  it("does not hover a selected moved block or thicken its outline", () => {
    const source = block("source", BlockType.Removed);
    source.isSelected = true;
    source.oldLines = [{ lineNumber: 1, kind: DiffChangeType.Deleted,
      fragments: [{ kind: DiffChangeType.Unchanged, text: "Moved text" }] }];
    source.move = { id: "move", role: "from", counterpartStartLine: 3,
      counterpartEndLine: 3, counterpartBlockId: "target", modified: false };
    expect(getHoveredBlockSurface(lineRow(source), source.id)).toBeNull();
    const sourceView = renderLine(source);
    const selectedRow = sourceView.container.querySelector(".border-border-default");
    expect(selectedRow).toHaveClass("border-l", "border-r");
    expect(selectedRow).not.toHaveClass("border-t", "border-b");
    const moveOutline = sourceView.container.querySelector(".border-accent");
    expect(moveOutline).toHaveClass("border-x", "border-t", "border-b");
    expect(moveOutline).not.toHaveClass("border-x-2", "border-t-2", "border-b-2");
  });
});
