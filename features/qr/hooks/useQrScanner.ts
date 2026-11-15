"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { describeQrScanContent, type QrScanContent } from "../services/qrScanContent";
import { disposeQrScanner, loadScanImage, QrScanError, scanQrImage } from "../services/qrScanner";

export interface QrScanCode extends QrScanContent {
  raw: string;
}

export type QrScanState =
  | { status: "idle" }
  | { status: "scanning"; imageUrl: string }
  | { status: "done"; imageUrl: string; codes: QrScanCode[] }
  | { status: "error"; imageUrl: string | null; message: string };

export function useQrScanner() {
  const [state, setState] = useState<QrScanState>({ status: "idle" });
  const requestRef = useRef(0);
  const imageUrlRef = useRef<string | null>(null);

  const releaseImage = useCallback(() => {
    if (imageUrlRef.current) URL.revokeObjectURL(imageUrlRef.current);
    imageUrlRef.current = null;
  }, []);

  const scan = useCallback(async (file: File) => {
    const request = ++requestRef.current;
    releaseImage();
    if (!file.type.startsWith("image/")) {
      setState({ status: "error", imageUrl: null, message: "This file is not an image. Choose a PNG, JPEG, WebP, or SVG file." });
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    imageUrlRef.current = imageUrl;
    setState({ status: "scanning", imageUrl });
    try {
      const image = await loadScanImage(imageUrl);
      const texts = await scanQrImage(image);
      if (request !== requestRef.current) return;
      setState({ status: "done", imageUrl, codes: texts.map((raw) => ({ raw, ...describeQrScanContent(raw) })) });
    } catch (error) {
      if (request !== requestRef.current) return;
      const message = error instanceof QrScanError ? error.message : "Scanning failed. Try again.";
      setState({ status: "error", imageUrl, message });
    }
  }, [releaseImage]);

  const close = useCallback(() => {
    requestRef.current += 1;
    releaseImage();
    setState({ status: "idle" });
  }, [releaseImage]);

  useEffect(() => () => {
    requestRef.current += 1;
    releaseImage();
    disposeQrScanner();
  }, [releaseImage]);

  return { state, scan, close };
}
