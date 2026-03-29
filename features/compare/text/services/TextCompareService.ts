import { ComparisonService } from "./comparisonService";
import { ComparisonResult } from "@/features/compare/text/types/diff";
import { CompareSettings } from "@/types/settings";

export class TextCompareService {
  public static compare(originalText: string, modifiedText: string, settings: CompareSettings): ComparisonResult {
    return ComparisonService.compare(originalText, modifiedText, settings);
  }
}

