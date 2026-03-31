import { BlockType } from "@/features/compare/text/types/diff";

export interface Chunk {
  type: BlockType;
  oldLines: Array<string>;
  newLines: Array<string>;
}
