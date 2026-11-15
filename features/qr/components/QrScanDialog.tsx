"use client";

import { useEffect, useRef, useState } from "react";
import { MdCheck, MdContentCopy, MdOpenInNew, MdQrCodeScanner } from "react-icons/md";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { DialogHeader } from "@/components/ui/DialogHeader";
import { buttonBase, buttonVariants, controlSizes } from "@/components/ui/controlStyles";
import { useToastStore } from "@/store/useToastStore";
import { cn } from "@/utils/uiHelpers";
import type { QrScanCode, QrScanState } from "../hooks/useQrScanner";

interface QrScanDialogProps {
  state: QrScanState;
  onClose: () => void;
  onScanFile: (file: File) => void;
}

function CopyButton({ value }: { value: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const pushToast = useToastStore((store) => store.pushToast);

  useEffect(() => {
    if (!isCopied) return;
    const timeoutId = window.setTimeout(() => setIsCopied(false), 1500);
    return () => window.clearTimeout(timeoutId);
  }, [isCopied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
    } catch {
      pushToast({ message: "Couldn't copy. Select the text and copy it yourself.", tone: "warning", icon: "warning", dedupeKey: "qr-scan-copy-error" });
    }
  };

  return <Button variant="outline" size="sm" leftIcon={isCopied ? <MdCheck /> : <MdContentCopy />} onClick={() => void copy()}>{isCopied ? "Copied" : "Copy"}</Button>;
}

function ScannedCode({ code, position, total }: { code: QrScanCode; position: number; total: number }) {
  const showsRawLink = code.link?.href === code.raw.trim();
  const hasDetails = code.fields.length > 0 || code.link !== null;
  const rawText = <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border-default bg-bg-secondary p-3 font-mono text-xs leading-5 text-text-primary custom-scrollbar">{code.raw}</pre>;

  return (
    <article className="min-w-0 rounded-lg border border-border-default p-3 sm:p-4" aria-label={total > 1 ? `QR code ${position} of ${total}` : "QR code"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{code.label}</span>
        {total > 1 && <span className="text-xs text-text-secondary">{position} of {total}</span>}
      </div>

      {code.link && (
        <div className="mt-3 min-w-0">
          <p className="break-all text-sm text-text-primary">{code.link.href}</p>
          <p className="mt-1 text-xs text-text-secondary">Opens <span className="font-semibold text-text-primary">{code.link.host}</span></p>
          {code.link.hasInternationalHost && <p className="mt-1 text-xs text-text-secondary">This address uses special characters. Check it before you open it.</p>}
        </div>
      )}

      {code.fields.length > 0 && (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-4">
          {code.fields.map((field) => (
            <div key={field.label} className="contents">
              <dt className="text-xs font-semibold text-text-secondary sm:pt-0.5">{field.label}</dt>
              <dd className="min-w-0 whitespace-pre-wrap wrap-break-word text-text-primary">{field.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {showsRawLink ? null : hasDetails ? (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-xs font-semibold text-text-secondary hover:text-text-primary">Show full text</summary>
          <div className="mt-2">{rawText}</div>
        </details>
      ) : <div className="mt-3">{rawText}</div>}

      <div className="mt-3 flex flex-wrap gap-2">
        <CopyButton value={code.raw} />
        {code.link && (
          <a href={code.link.href} target="_blank" rel="noopener noreferrer" className={cn(buttonBase, buttonVariants.primary, controlSizes.sm.field)}>
            <MdOpenInNew className={controlSizes.sm.iconContent} aria-hidden="true" />
            Open link
          </a>
        )}
      </div>
    </article>
  );
}

export function QrScanDialog({ state, onClose, onScanFile }: QrScanDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  if (state.status === "idle") return null;
  const imageUrl = state.imageUrl;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }} aria-labelledby="qr-scan-title" className="flex w-[min(94vw,36rem)] flex-col">
      <DialogHeader title="Scan result" titleId="qr-scan-title" onClose={onClose} />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 custom-scrollbar">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Scanned image" className="size-20 shrink-0 rounded-md border border-border-default bg-bg-secondary object-contain" />
          ) : (
            <span className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border-default bg-bg-secondary text-text-secondary"><MdQrCodeScanner className="text-3xl" aria-hidden="true" /></span>
          )}
          <p role="status" className={cn("text-sm", state.status === "error" ? "text-destructive" : "text-text-secondary")}>
            {state.status === "scanning" && "Reading the QR code..."}
            {state.status === "error" && state.message}
            {state.status === "done" && (state.codes.length === 0
              ? "No QR code found. Try a sharper image, or crop it closer to the code."
              : state.codes.length === 1 ? "Found 1 QR code." : `Found ${state.codes.length} QR codes.`)}
          </p>
        </div>

        {state.status === "done" && state.codes.map((code, index) => (
          <ScannedCode key={`${index}:${code.raw}`} code={code} position={index + 1} total={state.codes.length} />
        ))}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border-default p-4">
        <Button variant="outline" leftIcon={<MdQrCodeScanner />} onClick={() => inputRef.current?.click()}>Scan another image</Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Another image to scan"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onScanFile(file);
          }}
        />
        <Button onClick={onClose}>Done</Button>
      </div>
    </Dialog>
  );
}
