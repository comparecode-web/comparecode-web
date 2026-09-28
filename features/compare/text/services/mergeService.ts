import { BlockType, ChangeBlock } from "@/features/compare/text/types/diff";
import { MergeDirection } from "@/types/ui";

export class MergeService {
  public static mergeBlock(targetText: string, sourceText: string, block: ChangeBlock, direction: MergeDirection): string {
    if (block.kind === BlockType.Unchanged) return targetText;
    const leftToRight = direction === MergeDirection.LeftToRight;
    const targetStart = leftToRight ? block.startOffsetNew : block.startOffsetOld;
    const targetEnd = leftToRight ? block.endOffsetNew : block.endOffsetOld;
    const sourceStart = leftToRight ? block.startOffsetOld : block.startOffsetNew;
    const sourceEnd = leftToRight ? block.endOffsetOld : block.endOffsetNew;
    if (targetStart < 0 || targetEnd > targetText.length || targetStart > targetEnd ||
      sourceStart < 0 || sourceEnd > sourceText.length || sourceStart > sourceEnd) return targetText;
    return targetText.slice(0, targetStart) + sourceText.slice(sourceStart, sourceEnd) + targetText.slice(targetEnd);
  }
}
