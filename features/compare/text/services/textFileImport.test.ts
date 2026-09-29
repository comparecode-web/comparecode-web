import { describe, expect, it } from "vitest";
import { MAX_TEXT_IMPORT_BYTES, readTextCompareFile, TextImportError } from "./textFileImport";

function textFile(name: string, bytes: Uint8Array, type = ""): File {
  return { name, type, size: bytes.length, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) } as File;
}

describe("readTextCompareFile", () => {
  it("preserves Unicode and exact line endings while removing a UTF-8 BOM", async () => {
    const bytes = new TextEncoder().encode("\uFEFFÁrvíztűrő\r\nline\rthird\n");
    expect(await readTextCompareFile(textFile("sample.ts", bytes))).toBe("Árvíztűrő\r\nline\rthird\n");
  });

  it("accepts text MIME even without a known extension", async () => {
    expect(await readTextCompareFile(textFile("notes.unknown", new TextEncoder().encode("notes"), "text/plain"))).toBe("notes");
  });

  it("rejects unsupported, oversized, malformed UTF-8, and binary files", async () => {
    await expect(readTextCompareFile(textFile("photo.png", new Uint8Array([65])))).rejects.toMatchObject({ code: "unsupported" } satisfies Partial<TextImportError>);
    await expect(readTextCompareFile({ name: "huge.txt", type: "text/plain", size: MAX_TEXT_IMPORT_BYTES + 1 } as File)).rejects.toMatchObject({ code: "too-large" } satisfies Partial<TextImportError>);
    await expect(readTextCompareFile(textFile("bad.txt", new Uint8Array([0xff])))).rejects.toMatchObject({ code: "invalid-utf8" } satisfies Partial<TextImportError>);
    await expect(readTextCompareFile(textFile("binary.txt", new Uint8Array([65, 0, 66])))).rejects.toMatchObject({ code: "binary" } satisfies Partial<TextImportError>);
  });
});
