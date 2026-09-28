export enum BlockType {
  Unchanged = "Unchanged",
  Added = "Added",
  Removed = "Removed",
  Modified = "Modified"
}

export enum DiffChangeType {
  Unchanged = "Unchanged",
  Inserted = "Inserted",
  Deleted = "Deleted",
  Modified = "Modified",
  Imaginary = "Imaginary"
}

export enum Side {
  Old = "Old",
  New = "New"
}

export interface TextFragment {
  kind: DiffChangeType;
  text: string;
}

export interface ChangeLine {
  fragments: Array<TextFragment>;
  lineNumber: number | null;
  kind: DiffChangeType;
  lineEndingLabel?: string;
}

export interface ChangeBlock {
  id: string;
  kind: BlockType;
  oldLines: Array<ChangeLine>;
  newLines: Array<ChangeLine>;
  startIndexOld: number;
  startIndexNew: number;
  startOffsetOld: number;
  endOffsetOld: number;
  startOffsetNew: number;
  endOffsetNew: number;
  removalCount: number;
  additionCount: number;
  move?: {
    id: string;
    role: "from" | "to";
    counterpartStartLine: number;
    counterpartEndLine: number;
    counterpartBlockId: string;
    modified: boolean;
    number?: number;
  };
  isSelected?: boolean;
}

export interface ComparisonResult {
  blocks: Array<ChangeBlock>;
  limited: boolean;
}

export interface MinimapSegment {
  offsetPercentage: number;
  heightPercentage: number;
  leftType: BlockType;
  rightType: BlockType;
  targetLineIndex: number;
  block: ChangeBlock;
}
