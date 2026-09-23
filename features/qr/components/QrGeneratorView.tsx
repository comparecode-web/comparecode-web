"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MdDownload, MdLink, MdQrCode2, MdTextFields, MdWifi } from "react-icons/md";
import { OptionsSection } from "@/components/settings/OptionsSection";
import { Button } from "@/components/ui/Button";
import { ColorInput } from "@/components/ui/ColorInput";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { SelectDropdown } from "@/components/ui/SelectDropdown";
import { QrContentFields } from "./QrContentFields";
import { buildQrPayload, DEFAULT_QR_WEBSITE_URL, type QrContent } from "../services/qrPayload";
import {
  createQrPng,
  createQrSvg,
  createQrSymbol,
  DEFAULT_QR_COLORS,
  getQrColorError,
  getQrColorWarning,
  type QrErrorCorrection,
  type QrImageColors
} from "../services/qrImage";

type QrContentType = QrContent["type"];

const contentTypes = [
  { value: "url", label: "Website", icon: <MdLink /> },
  { value: "text", label: "Text", icon: <MdTextFields /> },
  { value: "wifi", label: "Wi-Fi", icon: <MdWifi /> }
] as const;

const pngSizes = [512, 1024, 2048] as const;
const errorCorrectionOptions: Array<{ value: QrErrorCorrection; label: string }> = [
  { value: "L", label: "Low 7%" },
  { value: "M", label: "Medium 15%" },
  { value: "Q", label: "High 25%" },
  { value: "H", label: "Maximum 30%" }
];

function emptyContent(type: QrContentType): QrContent {
  switch (type) {
    case "url": return { type, url: DEFAULT_QR_WEBSITE_URL };
    case "text": return { type, text: "" };
    case "wifi": return { type, ssid: "", password: "", security: "WPA", hidden: false };
  }
}

function hasInput(content: QrContent): boolean {
  switch (content.type) {
    case "url": return content.url.length > 0;
    case "text": return content.text.length > 0;
    case "wifi": return content.ssid.length > 0 || content.password.length > 0;
  }
}

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function QrGeneratorView() {
  const [content, setContent] = useState<QrContent>(emptyContent("url"));
  const [colors, setColors] = useState<QrImageColors>(DEFAULT_QR_COLORS);
  const [errorCorrection, setErrorCorrection] = useState<QrErrorCorrection>("M");
  const [pngTargetSize, setPngTargetSize] = useState<number>(1024);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const payload = useMemo(() => buildQrPayload(content), [content]);
  const colorError = getQrColorError(colors);
  const colorWarning = getQrColorWarning(colors);
  const generated = useMemo(() => {
    if (!payload.value) return { symbol: null, error: null };
    try {
      return { symbol: createQrSymbol(payload.value, errorCorrection), error: null };
    } catch {
      return { symbol: null, error: "This content is too long for a QR code at the selected error correction level." };
    }
  }, [payload.value, errorCorrection]);
  const svg = useMemo(() => generated.symbol && !colorError ? createQrSvg(generated.symbol, colors) : null, [generated.symbol, colors, colorError]);
  const previewUrl = svg ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` : null;
  const activeError = (hasInput(content) ? payload.error : null) ?? generated.error ?? colorError;
  const canDownload = Boolean(generated.symbol && svg && !activeError);

  const updateContent = (next: QrContent) => {
    setContent(next);
    setExportMessage(null);
  };

  const download = async (format: "svg" | "png") => {
    if (!generated.symbol || !svg || !canDownload) return;
    try {
      const blob = format === "svg"
        ? new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
        : await createQrPng(generated.symbol, colors, pngTargetSize);
      saveBlob(blob, `comparecode-qr-code.${format}`);
      setExportMessage(`${format.toUpperCase()} downloaded.`);
    } catch {
      setExportMessage("The QR code could not be downloaded. Try again.");
    }
  };

  return (
    <div className="h-full min-h-0 w-full overflow-y-auto bg-bg-secondary custom-scrollbar">
      <div className="mx-auto w-full max-w-7xl p-3 sm:p-5 lg:p-7">
        <header className="mb-5 flex min-w-0 items-start gap-3 sm:mb-7">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-accent-primary/25 bg-accent-primary/10 text-accent-primary"><MdQrCode2 className="text-2xl" /></span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">QR code generator</h1>
            <p className="mt-1 text-sm leading-6 text-text-secondary">Create a static QR code in your browser. Your content is not uploaded or saved.</p>
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-xl border border-border-default bg-bg-primary p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-bold text-text-primary">Content</h2>
              <p className="mt-1 text-sm text-text-secondary">Choose what the QR code should contain.</p>
              <SelectionBar<QrContentType>
                options={[...contentTypes]}
                value={content.type}
                onChange={(type) => { updateContent(emptyContent(type)); setPasswordVisible(false); }}
                className="mt-4 grid grid-cols-3"
                buttonClassName="min-h-11 min-w-0 px-2"
              />
              <div className="mt-5"><QrContentFields content={content} onChange={updateContent} passwordVisible={passwordVisible} onPasswordVisibleChange={setPasswordVisible} /></div>
            </section>

            <OptionsSection title="Appearance" description="Choose colors and the PNG size." isDirty={colors.dark !== DEFAULT_QR_COLORS.dark || colors.light !== DEFAULT_QR_COLORS.light || pngTargetSize !== 1024} onReset={() => { setColors(DEFAULT_QR_COLORS); setPngTargetSize(1024); setExportMessage(null); }}>
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorInput label="Code color" value={colors.dark} onChange={(dark) => { setColors((current) => ({ ...current, dark })); setExportMessage(null); }} />
                <ColorInput label="Background color" value={colors.light} pickerFallback="#ffffff" onChange={(light) => { setColors((current) => ({ ...current, light })); setExportMessage(null); }} />
              </div>
              <div className="mt-4"><SelectDropdown label="PNG size" value={String(pngTargetSize)} onChange={(value) => { setPngTargetSize(Number(value)); setExportMessage(null); }} options={pngSizes.map((size) => ({ value: String(size), label: `${size} px` }))} /></div>
              {colorError && <p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{colorError}</p>}
              {colorWarning && <p role="status" className="mt-3 rounded-lg border border-info-border bg-info-bg p-3 text-sm text-text-primary">{colorWarning} You can still download this code.</p>}
            </OptionsSection>

            <OptionsSection title="Error correction" description="Higher levels survive more damage but hold less content. Percentages are approximate." isDirty={errorCorrection !== "M"} onReset={() => { setErrorCorrection("M"); setExportMessage(null); }}>
              <SelectDropdown label="Level" value={errorCorrection} onChange={(level) => { setErrorCorrection(level as QrErrorCorrection); setExportMessage(null); }} options={errorCorrectionOptions} />
            </OptionsSection>
          </div>

          <section className="min-w-0 rounded-xl border border-border-default bg-bg-primary p-4 shadow-sm sm:p-5 lg:sticky lg:top-5" aria-labelledby="qr-preview-title">
            <div>
              <h2 id="qr-preview-title" className="text-base font-bold text-text-primary">Preview</h2>
              <p className="mt-1 text-sm text-text-secondary">The saved image will contain this code.</p>
            </div>

            <div className="mt-5 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-secondary p-5 sm:p-8">
              {previewUrl ? <Image src={previewUrl} alt={`${content.type} QR code preview`} width={512} height={512} unoptimized className="block aspect-square max-h-full max-w-full object-contain shadow-sm" /> : (
                <div className="flex max-w-xs flex-col items-center gap-3 text-center text-text-secondary">
                  <MdQrCode2 className="text-6xl opacity-30" aria-hidden="true" />
                  <p className="text-sm">Enter valid content and colors to see your QR code.</p>
                </div>
              )}
            </div>

            {activeError && hasInput(content) && !colorError && <p role="alert" className="mt-3 text-sm text-danger">{activeError}</p>}
            <dl className="mt-4 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border-default bg-border-default text-sm sm:grid-cols-2">
              <div className="min-w-0 bg-bg-secondary p-3">
                <dt className="text-xs text-text-secondary">PNG output</dt>
                <dd className="mt-1 font-semibold text-text-primary">{generated.symbol ? `${pngTargetSize} × ${pngTargetSize} px` : "—"}</dd>
              </div>
              <div className="min-w-0 bg-bg-secondary p-3">
                <dt className="text-xs text-text-secondary">Error recovery</dt>
                <dd className="mt-1 font-semibold text-text-primary">{errorCorrectionOptions.find((option) => option.value === errorCorrection)?.label}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-5 text-text-secondary">The QR image itself does not expire, track scans, or encrypt its contents.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Button type="button" disabled={!canDownload} leftIcon={<MdDownload className="text-lg" />} onClick={() => void download("png")}>Download PNG</Button>
              <Button type="button" variant="outline" disabled={!canDownload} leftIcon={<MdDownload className="text-lg" />} onClick={() => void download("svg")}>Download SVG</Button>
            </div>
            {exportMessage && <p role="status" className="mt-3 text-xs text-text-secondary">{exportMessage}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
