"use client";

import { useId, useState } from "react";
import { MdAutoFixHigh, MdSync } from "react-icons/md";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { useImageCompareStore } from "../../store/useImageCompareStore";
import { isAutoAlignmentAvailable } from "../../services/alignment/types";
import { getPairKey } from "../../services/alignment/transformUtils";

export function AutoAlignButton({ size = "sm", className }: { size?: ButtonSize; className?: string }) {
  const originalImage = useImageCompareStore(s => s.originalImage);
  const modifiedImage = useImageCompareStore(s => s.modifiedImage);
  const status = useImageCompareStore(s => s.alignment.status);
  const options = useImageCompareStore(s => s.alignment.options);
  const runAutoAlignment = useImageCompareStore(s => s.runAutoAlignment);
  const [confirmationPair, setConfirmationPair] = useState<string | null>(null);
  const titleId = useId();
  const pairKey = getPairKey(originalImage, modifiedImage);
  const disabled = !pairKey || status === "aligning" || !isAutoAlignmentAvailable(options);

  return (
    <>
      <Button
        variant="outline"
        size={size}
        className={className}
        onClick={() => setConfirmationPair(pairKey)}
        disabled={disabled}
        aria-busy={status === "aligning"}
        leftIcon={status === "aligning" ? <MdSync className="animate-spin motion-reduce:animate-none" /> : <MdAutoFixHigh />}
      >
        {status === "aligning" ? "Aligning..." : "Auto align"}
      </Button>
      <Dialog open={!!confirmationPair && confirmationPair === pairKey} onOpenChange={open => { if (!open) setConfirmationPair(null); }} aria-labelledby={titleId}>
        <DialogHeader title="Automatically align images?" titleId={titleId} onClose={() => setConfirmationPair(null)} />
        <div className="p-4">
          <p className="text-sm text-text-secondary">This will replace the current alignment using shared image details. You can fine-tune the result afterwards.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmationPair(null)}>Cancel</Button>
            <Button disabled={disabled} onClick={() => {
              setConfirmationPair(null);
              void runAutoAlignment();
            }}>Auto align</Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
