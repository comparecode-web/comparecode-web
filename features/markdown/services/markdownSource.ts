import { parseMarkdownFrontmatterDetailed, type MarkdownFrontmatter } from "@/features/markdown/services/markdownFrontmatter";
import { normalizeMultilineStyleMarkers } from "@/features/markdown/services/markdownPreprocess";

export const markdownFrontmatterTableMarker = "<!-- comparecode-frontmatter-table -->";

export interface PreparedMarkdownSource {
  source: string;
  invalidFrontmatterRaw: string | null;
  frontmatterFields: MarkdownFrontmatter["fields"];
  hasFrontmatterTableMarker: boolean;
}

function toBlankLines(value: string): string {
  return "\n".repeat(value.split("\n").length - 1);
}

function replaceMarkerFrontmatter(source: string): { source: string; fields: MarkdownFrontmatter["fields"] } {
  const markerIndex = source.indexOf(markdownFrontmatterTableMarker);
  const beforeMarker = source.slice(0, markerIndex);
  const match = /(^|\n)(---\n[\s\S]*?\n---)\s*$/.exec(beforeMarker);
  if (!match) {
    return { source, fields: [] };
  }

  const parsed = parseMarkdownFrontmatterDetailed(match[2]);
  if (parsed.status !== "valid") {
    return { source, fields: [] };
  }

  const blockStart = match.index + match[1].length;
  const blockEnd = blockStart + match[2].length;

  return {
    source: `${source.slice(0, blockStart)}${toBlankLines(match[2])}${source.slice(blockEnd)}`,
    fields: parsed.fields
  };
}

export function prepareMarkdownSource(value: string): PreparedMarkdownSource {
  const normalized = normalizeMultilineStyleMarkers(value.replace(/\r\n/g, "\n").replace(/\r/g, "\n"));
  const frontmatter = parseMarkdownFrontmatterDetailed(normalized);
  let source = normalized;
  let invalidFrontmatterRaw: string | null = null;
  let frontmatterFields: MarkdownFrontmatter["fields"] = [];

  if (frontmatter.status === "invalid") {
    invalidFrontmatterRaw = frontmatter.raw;
    source = `${toBlankLines(frontmatter.raw)}${normalized.slice(frontmatter.raw.length)}`;
  } else if (frontmatter.status === "valid") {
    frontmatterFields = frontmatter.fields;
    source = `${toBlankLines(frontmatter.raw)}${normalized.slice(frontmatter.raw.length)}`;
  }

  const hasFrontmatterTableMarker = source.includes(markdownFrontmatterTableMarker);
  if (hasFrontmatterTableMarker) {
    const marker = replaceMarkerFrontmatter(source);
    source = marker.source;
    if (marker.fields.length > 0) {
      frontmatterFields = marker.fields;
    }
  }

  return { source, invalidFrontmatterRaw, frontmatterFields, hasFrontmatterTableMarker };
}
