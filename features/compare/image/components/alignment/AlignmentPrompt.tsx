"use client";

import { Button } from "@/components/ui/Button";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { estimateAutoAlignment } from "../../services/alignment/autoAlignService";

export function AlignmentPrompt() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const alignment = useImageCompareStore((s) => s.alignment);
  const skipAlignmentPrompt = useImageCompareStore((s) => s.skipAlignmentPrompt);
  const setAlignmentStatus = useImageCompareStore((s) => s.setAlignmentStatus);
  const applyAlignmentTransform = useImageCompareStore((s) => s.applyAlignmentTransform);
  const setAlignmentError = useImageCompareStore((s) => s.setAlignmentError);

  if (!alignment.isPromptOpen || !alignment.promptPairKey || !originalImage || !modifiedImage) {
    return null;
  }

  const handleAutoAlign = async () => {
    setAlignmentStatus("aligning");
    const result = await estimateAutoAlignment(originalImage, modifiedImage, alignment.options);
    if (result.success && result.transform) {
      applyAlignmentTransform(result.transform, {
        method: "auto",
        confidence: result.confidence ?? null,
        matchCount: result.matchCount ?? null,
        timestamp: Date.now()
      });
      return;
    }

    setAlignmentError(
      result.error?.code ?? "alignment/failed",
      result.error?.message ?? "Auto align failed. Use manual alignment to place the images precisely."
    );
  };

  const handleSkip = () => {
    if (alignment.promptPairKey) {
      skipAlignmentPrompt(alignment.promptPairKey);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-lg border border-border-default bg-bg-primary p-5 shadow-xl">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-text-primary">Automatically align images?</h2>
          <p className="text-sm text-text-secondary">
            These images have different dimensions and may not line up correctly.
          </p>
        </div>
        {alignment.status === "aligning" && (
          <p className="mt-4 rounded-md border border-border-default bg-bg-secondary px-3 py-2 text-sm font-semibold text-text-secondary">
            Aligning images...
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="ghost" onClick={handleSkip} disabled={alignment.status === "aligning"}>
            Skip align
          </Button>
          <Button onClick={handleAutoAlign} disabled={alignment.status === "aligning"}>
            Auto align
          </Button>
        </div>
      </div>
    </div>
  );
}
