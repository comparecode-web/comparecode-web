"use client";

import { useRef, useState } from "react";
import { MdClose, MdDescription, MdDownload, MdPictureAsPdf } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import type { ComparisonResult } from "@/features/compare/text/types/diff";
import { createComparisonPdf, downloadBlob, downloadText } from "@/features/compare/text/services/textExport";
import { useToastStore } from "@/store/useToastStore";

interface ExportDialogProps {
  result: ComparisonResult | null;
  original: string;
  modified: string;
}

export function ExportDialog({ result, original, modified }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const pushToast = useToastStore((state) => state.pushToast);
  const downloadPdf = async () => {
    if (!result || isGenerating) return;
    setIsGenerating(true);
    try {
      downloadBlob(await createComparisonPdf(result), "comparecode-comparison.pdf");
      dialogRef.current?.close();
      pushToast({ message: "Comparison PDF downloaded.", tone: "success" });
    } catch {
      pushToast({ message: "The PDF could not be generated. Try again.", tone: "error" });
    } finally {
      setIsGenerating(false);
    }
  };

  return <>
    <Button size="sm" variant="outline" className="shrink-0 px-2" aria-label="Export comparison" onClick={() => dialogRef.current?.showModal()} disabled={!original && !modified} leftIcon={<MdDownload className="text-lg" />}>Export</Button>
    <dialog ref={dialogRef} className="m-auto w-[min(92vw,27rem)] rounded-xl border border-border-default bg-bg-primary p-0 text-text-primary shadow-2xl backdrop:bg-black/50" aria-labelledby="text-export-title">
      <div className="flex items-center justify-between border-b border-border-default p-4">
        <h2 id="text-export-title" className="text-lg font-bold">Export comparison</h2>
        <Button size="icon" variant="outline" aria-label="Close export" onClick={() => dialogRef.current?.close()}><MdClose /></Button>
      </div>
      <div className="grid gap-3 p-4">
        <p className="text-sm text-text-secondary">Download a full comparison report or either text panel. Files stay in your browser.</p>
        <Button variant="outline" className="justify-start" disabled={!result || isGenerating} onClick={() => void downloadPdf()} leftIcon={<MdPictureAsPdf className="text-xl" />}>{isGenerating ? "Generating PDF..." : "Comparison PDF"}</Button>
        <Button variant="outline" className="justify-start" disabled={!original} onClick={() => downloadText(original, "original")} leftIcon={<MdDescription className="text-xl" />}>Original text (.txt)</Button>
        <Button variant="outline" className="justify-start" disabled={!modified} onClick={() => downloadText(modified, "modified")} leftIcon={<MdDescription className="text-xl" />}>Modified text (.txt)</Button>
      </div>
    </dialog>
  </>;
}
