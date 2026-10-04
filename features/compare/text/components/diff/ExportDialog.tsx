"use client";

import { useState } from "react";
import { MdDescription, MdDownload, MdPictureAsPdf } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import type { ComparisonResult } from "@/features/compare/text/types/diff";
import { createComparisonPdf, downloadBlob, downloadText } from "@/features/compare/text/services/textExport";
import { useToastStore } from "@/store/useToastStore";

interface ExportDialogProps {
  result: ComparisonResult | null;
  original: string;
  modified: string;
}

export function ExportDialog({ result, original, modified }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);
  const downloadPdf = async () => {
    if (!result || isGenerating) return;
    setIsGenerating(true);
    try {
      downloadBlob(await createComparisonPdf(result), "comparecode-comparison.pdf");
      setIsOpen(false);
      pushToast({ message: "Comparison PDF downloaded.", tone: "success" });
    } catch {
      pushToast({ message: "The PDF could not be generated. Try again.", tone: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return <>
    <Button size="sm" variant="outline" className="shrink-0" aria-label="Export comparison" onClick={() => setIsOpen(true)} disabled={!original && !modified} leftIcon={<MdDownload />}>Export</Button>
    <Dialog open={isOpen} onOpenChange={setIsOpen} aria-labelledby="text-export-title">
      <DialogHeader title="Export comparison" titleId="text-export-title" closeLabel="Close export" onClose={() => setIsOpen(false)} />
      <div className="grid gap-3 p-4">
        <p className="text-sm text-text-secondary">Download a full comparison report or either text panel. Files stay in your browser.</p>
        <Button variant="outline" className="justify-start" disabled={!result || isGenerating} onClick={() => void downloadPdf()} leftIcon={<MdPictureAsPdf className="text-xl" />}>{isGenerating ? "Generating PDF..." : "Comparison PDF"}</Button>
        <Button variant="outline" className="justify-start" disabled={!original} onClick={() => downloadText(original, "original")} leftIcon={<MdDescription className="text-xl" />}>Original text (.txt)</Button>
        <Button variant="outline" className="justify-start" disabled={!modified} onClick={() => downloadText(modified, "modified")} leftIcon={<MdDescription className="text-xl" />}>Modified text (.txt)</Button>
      </div>
    </Dialog>
  </>;
}
