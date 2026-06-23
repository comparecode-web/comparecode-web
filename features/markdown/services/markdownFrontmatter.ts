export interface MarkdownFrontmatter {
  fields: Array<{
    key: string;
    value: string | Array<string>;
  }>;
  content: string;
}

export interface MarkdownFrontmatterParseResult extends MarkdownFrontmatter {
  status: "none" | "valid" | "invalid";
  raw: string;
}

function parseTagsValue(value: string): Array<string> {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [trimmed.replace(/^["']|["']$/g, "")];
  }

  return trimmed
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function parseFrontmatterFields(lines: Array<string>): MarkdownFrontmatter["fields"] | null {
  const fields: MarkdownFrontmatter["fields"] = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) {
      continue;
    }

    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      return null;
    }

    const key = match[1].trim();
    const rawValue = match[2].trim();

    if (key === "tags") {
      fields.push({ key, value: parseTagsValue(rawValue) });
      continue;
    }

    fields.push({ key, value: rawValue.replace(/^["']|["']$/g, "") });
  }

  return fields;
}

export function parseMarkdownFrontmatterDetailed(value: string): MarkdownFrontmatterParseResult {
  if (!value.startsWith("---\n") && !value.startsWith("---\r\n")) {
    return { status: "none", fields: [], content: value, raw: "" };
  }

  const lineEnding = value.includes("\r\n") ? "\r\n" : "\n";
  const lines = value.split(lineEnding);
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (closingIndex < 0) {
    return { status: "invalid", fields: [], content: "", raw: value };
  }

  const frontmatterLines = lines.slice(1, closingIndex);
  const fields = parseFrontmatterFields(frontmatterLines);
  const raw = lines.slice(0, closingIndex + 1).join(lineEnding);
  const content = lines.slice(closingIndex + 1).join(lineEnding).trimStart();

  if (!fields) {
    return { status: "invalid", fields: [], content, raw };
  }

  return {
    status: "valid",
    fields,
    content,
    raw
  };
}

export function parseMarkdownFrontmatter(value: string): MarkdownFrontmatter {
  const result = parseMarkdownFrontmatterDetailed(value);
  if (result.status === "valid") {
    return { fields: result.fields, content: result.content };
  }

  return { fields: [], content: value };
}
