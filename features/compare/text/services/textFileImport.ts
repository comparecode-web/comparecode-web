export const MAX_TEXT_IMPORT_BYTES = 5 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  "txt", "text", "md", "markdown", "log", "csv", "tsv", "json", "jsonl", "xml", "yaml", "yml",
  "html", "htm", "css", "scss", "js", "jsx", "ts", "tsx", "mjs", "cjs", "py", "java",
  "c", "h", "cpp", "hpp", "cs", "go", "rs", "rb", "php", "sh", "ps1", "sql", "toml",
  "ini", "conf", "config", "properties", "diff", "patch", "svg", "vue", "svelte", "gitignore"
]);
export const TEXT_IMPORT_ACCEPT = `text/*,${Array.from(TEXT_EXTENSIONS, (extension) => `.${extension}`).join(",")}`;

export class TextImportError extends Error {
  constructor(public readonly code: "unsupported" | "too-large" | "invalid-utf8" | "binary" | "read-failed") {
    super({
      unsupported: "Choose a text, code, log, or data file.",
      "too-large": "The file exceeds the 5 MiB limit.",
      "invalid-utf8": "The file is not valid UTF-8 text.",
      binary: "The file contains binary data.",
      "read-failed": "The file could not be read. Try again."
    }[code]);
  }
}

export async function readTextCompareFile(file: File): Promise<string> {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!TEXT_EXTENSIONS.has(extension) && !file.type.toLowerCase().startsWith("text/")) {
    throw new TextImportError("unsupported");
  }
  if (file.size > MAX_TEXT_IMPORT_BYTES) throw new TextImportError("too-large");

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    throw new TextImportError("read-failed");
  }
  if (bytes.byteLength > MAX_TEXT_IMPORT_BYTES) throw new TextImportError("too-large");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new TextImportError("invalid-utf8");
  }
  if (text.includes("\0") || /[\x01-\x08\x0B\x0C\x0E-\x1F]/u.test(text)) {
    throw new TextImportError("binary");
  }
  return text.startsWith("\uFEFF") ? text.slice(1) : text;
}
