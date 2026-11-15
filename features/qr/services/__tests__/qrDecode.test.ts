// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { prepareZXingModule, readBarcodes } from "zxing-wasm/reader";
import sharp from "sharp";
import { buildQrPayload, type QrContent } from "../qrPayload";
import { createQrSvg, createQrSymbol, DEFAULT_QR_COLORS, QR_BORDER } from "../qrImage";
import { describeQrScanContent } from "../qrScanContent";
import { DEFAULT_QR_STYLE, QR_BORDER_SHAPES, QR_CENTER_SHAPES, QR_MODULE_SHAPES, type QrStyle } from "../qrShapes";

const modulePixels = 4;

function renderSymbol(payload: string) {
  const { modules } = createQrSymbol(payload, "M");
  const side = (modules.size + QR_BORDER * 2) * modulePixels;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let row = 0; row < modules.size; row += 1) {
    for (let column = 0; column < modules.size; column += 1) {
      if (!modules.get(row, column)) continue;
      for (let y = 0; y < modulePixels; y += 1) {
        for (let x = 0; x < modulePixels; x += 1) {
          const offset = (((row + QR_BORDER) * modulePixels + y) * side + (column + QR_BORDER) * modulePixels + x) * 4;
          data.fill(0, offset, offset + 3);
        }
      }
    }
  }
  return { width: side, height: side, data, colorSpace: "srgb" } as ImageData;
}

const cases: Array<{ label: string; content: QrContent; fields: Array<[string, string]> }> = [
  { label: "Website", content: { type: "url", url: "https://example.com/a?x=1&y=2" }, fields: [] },
  { label: "Text", content: { type: "text", text: "Árvíztűrő\n🙂" }, fields: [] },
  { label: "Wi-Fi", content: { type: "wifi", ssid: "Cafe;Guest", password: "a:b", security: "WPA", hidden: true }, fields: [["Network", "Cafe;Guest"], ["Security", "WPA"], ["Password", "a:b"], ["Hidden network", "Yes"]] },
  { label: "Email", content: { type: "email", to: "anna+qr@example.com", subject: "Hi & bye?", body: "Árvíz 1\nLine 2" }, fields: [["To", "anna+qr@example.com"], ["Subject", "Hi & bye?"], ["Message", "Árvíz 1\nLine 2"]] },
  { label: "Phone", content: { type: "phone", number: "+36 (30) 123-4567" }, fields: [["Number", "+36301234567"]] }
];

describe("QR decoding with an independent reader", () => {
  beforeAll(async () => {
    const wasmPath = path.resolve("node_modules/zxing-wasm/dist/reader/zxing_reader.wasm");
    const wasm = readFileSync(wasmPath);
    await prepareZXingModule({ overrides: { wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength) }, fireImmediately: true });
  });

  it.each(cases)("reads back the generated $label payload and its fields", async ({ content, fields }) => {
    const payload = buildQrPayload(content).value;
    if (!payload) throw new Error("Payload was not generated.");

    const results = await readBarcodes(renderSymbol(payload), { formats: ["QRCodeModel1", "QRCodeModel2"] });

    expect(results.map((result) => result.text)).toEqual([payload]);
    expect(describeQrScanContent(results[0].text).fields.map((field) => [field.label, field.value])).toEqual(fields);
  });

  const styledCases: Array<{ label: string; shape: Partial<QrStyle> }> = [
    ...QR_MODULE_SHAPES.map((modules) => ({ label: `${modules} modules`, shape: { modules } })),
    ...QR_BORDER_SHAPES.map((border) => ({ label: `${border} corner border`, shape: { modules: "dots" as const, border, center: border } })),
    ...QR_CENTER_SHAPES.map((center) => ({ label: `${center} corner center`, shape: { modules: "dots" as const, border: "rounded" as const, center } }))
  ];

  it.each(styledCases)("reads back the exported SVG with $label at full and small size", async ({ shape }) => {
    const payload = "https://www.comparecodeweb.com/";
    const svg = createQrSvg(createQrSymbol(payload, "M"), DEFAULT_QR_COLORS, { ...DEFAULT_QR_STYLE, ...shape });

    for (const size of [512, 160]) {
      const { data, info } = await sharp(Buffer.from(svg)).resize(size, size).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const results = await readBarcodes({ width: info.width, height: info.height, data: new Uint8ClampedArray(data), colorSpace: "srgb" } as ImageData, { formats: ["QRCodeModel2"] });
      expect(results.map((result) => result.text)).toEqual([payload]);
    }
  });
});
