import { CompareResult, ImageCompareInput } from "@/features/compare/shared/types/compareInput";

export class ImageCompareService {
  public static compare(input: ImageCompareInput): CompareResult {
    return { mode: input.mode };
  }
}
