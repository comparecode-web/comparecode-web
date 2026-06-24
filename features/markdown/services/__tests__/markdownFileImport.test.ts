import { describe, expect, it } from "vitest";
import {
  findFirstSupportedMarkdownTextFile,
  isSupportedMarkdownTextFile,
  MarkdownFileImportError,
  MAX_MARKDOWN_IMPORT_BYTES,
  normalizeImportedMarkdownText,
  readMarkdownTextFile
} from "@/features/markdown/services/markdownFileImport";

describe("markdownFileImport", () => {
  it("accepts markdown and text files by extension or MIME type", () => {
    expect(isSupportedMarkdownTextFile(new File(["# Note"], "note.md", { type: "" }))).toBe(true);
    expect(isSupportedMarkdownTextFile(new File(["# Note"], "note.markdown", { type: "" }))).toBe(true);
    expect(isSupportedMarkdownTextFile(new File(["Plain"], "note.bin", { type: "text/plain" }))).toBe(true);
    expect(isSupportedMarkdownTextFile(new File(["<html></html>"], "page.html", { type: "text/html" }))).toBe(false);
  });

  it("finds the first supported file from a multi-file drop", () => {
    const imageFile = new File(["image"], "image.png", { type: "image/png" });
    const markdownFile = new File(["# Note"], "note.md", { type: "" });
    const textFile = new File(["Plain"], "note.txt", { type: "text/plain" });

    expect(findFirstSupportedMarkdownTextFile([imageFile, markdownFile, textFile])).toBe(markdownFile);
  });

  it("removes a UTF-8 BOM from imported text", () => {
    expect(normalizeImportedMarkdownText("\ufeff# Note")).toBe("# Note");
  });

  it("reads supported text files", async () => {
    await expect(readMarkdownTextFile(new File(["# Imported"], "import.md", { type: "text/markdown" })))
      .resolves.toBe("# Imported");
  });

  it("rejects files larger than the import limit", async () => {
    const file = new File([new Uint8Array(MAX_MARKDOWN_IMPORT_BYTES + 1)], "large.md", {
      type: "text/markdown"
    });

    await expect(readMarkdownTextFile(file)).rejects.toMatchObject<Partial<MarkdownFileImportError>>({
      code: "file-too-large"
    });
  });
});
