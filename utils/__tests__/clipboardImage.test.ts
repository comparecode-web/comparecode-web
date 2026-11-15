import { afterEach, describe, expect, it, vi } from "vitest";
import { clipboardHasText, getImageFileFromClipboardData, readClipboardImage } from "../clipboardImage";

function transfer(items: Array<{ kind: string; type: string; file?: File }>): DataTransfer {
  return { items: items.map((item) => ({ ...item, getAsFile: () => item.file ?? null })) } as unknown as DataTransfer;
}

function stubClipboard(read: () => Promise<unknown>) {
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { read } });
}

describe("clipboard images", () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, "clipboard");
  });

  it("finds the first image file in pasted data and detects plain text", () => {
    const image = new File(["png"], "shot.png", { type: "image/png" });
    const data = transfer([{ kind: "string", type: "text/plain" }, { kind: "file", type: "text/plain" }, { kind: "file", type: "image/png", file: image }]);

    expect(getImageFileFromClipboardData(data)).toBe(image);
    expect(clipboardHasText(data)).toBe(true);
    expect(getImageFileFromClipboardData(transfer([{ kind: "string", type: "text/plain" }]))).toBeNull();
    expect(getImageFileFromClipboardData(null)).toBeNull();
  });

  it("reads an image from the clipboard as a named file", async () => {
    const getType = vi.fn(async () => new Blob(["svg"], { type: "image/svg+xml" }));
    stubClipboard(async () => [{ types: ["text/plain"], getType }, { types: ["text/html", "image/svg+xml"], getType }]);

    const result = await readClipboardImage();

    expect(getType).toHaveBeenCalledWith("image/svg+xml");
    expect(result.file?.name).toBe("pasted-image.svg");
    expect(result.file?.type).toBe("image/svg+xml");
  });

  it("explains when there is no image, access is denied, or the browser lacks support", async () => {
    stubClipboard(async () => [{ types: ["text/plain"], getType: vi.fn() }]);
    expect((await readClipboardImage()).error).toMatch(/no image in the clipboard/);

    stubClipboard(async () => { throw new DOMException("denied", "NotAllowedError"); });
    expect((await readClipboardImage()).error).toMatch(/Allow clipboard access or press Ctrl\+V/);

    Reflect.deleteProperty(navigator, "clipboard");
    expect((await readClipboardImage()).error).toMatch(/Press Ctrl\+V instead/);
  });
});
