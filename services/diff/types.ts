import { BlockType } from "@/types/diff";

export interface Chunk {
  type: BlockType;
  oldLines: Array<string>;
  newLines: Array<string>;
}