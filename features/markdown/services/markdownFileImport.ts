export const MAX_MARKDOWN_IMPORT_BYTES = 5 * 1024 * 1024;

const supportedExtensions = new Set(["md", "markdown", "mdown", "mkd", "txt", "text"]);
const supportedMimeTypes = new Set(["text/plain", "text/markdown"]);

export type MarkdownFileImportErrorCode = "unsupported-type" | "file-too-large" | "read-failed";

export class MarkdownFileImportError extends Error {
  public readonly code: MarkdownFileImportErrorCode;

  public constructor(code: MarkdownFileImportErrorCode, message: string) {
    super(message);
    this.name = "MarkdownFileImportError";
    this.code = code;
  }
}

function getFileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function isSupportedMarkdownTextFile(file: File): boolean {
  const type = file.type.trim().toLowerCase();
  if (type && supportedMimeTypes.has(type)) {
    return true;
  }

  return supportedExtensions.has(getFileExtension(file.name));
}

export function findFirstSupportedMarkdownTextFile(files: FileList | Array<File>): File | null {
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    if (isSupportedMarkdownTextFile(file)) {
      return file;
    }
  }

  return null;
}

export function normalizeImportedMarkdownText(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

export async function readMarkdownTextFile(file: File): Promise<string> {
  if (!isSupportedMarkdownTextFile(file)) {
    throw new MarkdownFileImportError("unsupported-type", "Unsupported file type.");
  }

  if (file.size > MAX_MARKDOWN_IMPORT_BYTES) {
    throw new MarkdownFileImportError("file-too-large", "File is too large.");
  }

  try {
    return normalizeImportedMarkdownText(await file.text());
  } catch {
    throw new MarkdownFileImportError("read-failed", "Failed to read file.");
  }
}
