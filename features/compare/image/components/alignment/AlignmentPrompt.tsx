"use client";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { isAutoAlignmentAvailable } from "../../services/alignment/types";

export function AlignmentPrompt() {
  const originalImage = useImageCompareStore((s) => s.originalImage);
  const modifiedImage = useImageCompareStore((s) => s.modifiedImage);
  const alignment = useImageCompareStore((s) => s.alignment);
  const skipAlignmentPrompt = useImageCompareStore((s) => s.skipAlignmentPrompt);
  const runAutoAlignment = useImageCompareStore((s) => s.runAutoAlignment);

  if (!alignment.isPromptOpen || !alignment.promptPairKey || !originalImage || !modifiedImage) {
    return null;
  }

  const handleSkip = () => {
    if (alignment.promptPairKey) {
      skipAlignmentPrompt(alignment.promptPairKey);
    }
  };

  return (
    <Dialog open onOpenChange={open => { if (!open) handleSkip(); }} dismissible={alignment.status !== "aligning"} aria-labelledby="alignment-prompt-title" className="w-[min(92vw,28rem)] p-5">
        <div className="flex flex-col gap-2">
          <h2 id="alignment-prompt-title" className="text-lg font-bold text-text-primary">Automatically align images?</h2>
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
          <Button onClick={runAutoAlignment} disabled={alignment.status === "aligning" || !isAutoAlignmentAvailable(alignment.options)}>
            Auto align
          </Button>
        </div>
    </Dialog>
  );
}
