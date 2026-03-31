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
  isWhitespaceChange: boolean;
}

export interface ChangeLine {
  fragments: Array<TextFragment>;
  lineNumber: number | null;
  kind: DiffChangeType;
  isInModifiedBlock: boolean;
}

export interface ChangeBlock {
  id: string;
  kind: BlockType;
  oldLines: Array<ChangeLine>;
  newLines: Array<ChangeLine>;
  startIndexOld: number;
  startIndexNew: number;
  isWhitespaceChange: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
}

export interface ComparisonResult {
  blocks: Array<ChangeBlock>;
}

export interface MinimapSegment {
  offsetPercentage: number;
  heightPercentage: number;
  leftType: BlockType;
  rightType: BlockType;
  targetLineIndex: number;
  block: ChangeBlock;
}
