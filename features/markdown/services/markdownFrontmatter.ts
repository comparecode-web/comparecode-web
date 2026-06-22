export interface MarkdownFrontmatter {
  fields: Array<{
    key: string;
    value: string | Array<string>;
  }>;
  content: string;
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

export function parseMarkdownFrontmatter(value: string): MarkdownFrontmatter {
  if (!value.startsWith("---\n") && !value.startsWith("---\r\n")) {
    return { fields: [], content: value };
  }

  const lineEnding = value.includes("\r\n") ? "\r\n" : "\n";
  const lines = value.split(lineEnding);
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");

  if (closingIndex < 0) {
    return { fields: [], content: value };
  }

  const fields: MarkdownFrontmatter["fields"] = [];
  const frontmatterLines = lines.slice(1, closingIndex);

  for (let index = 0; index < frontmatterLines.length; index++) {
    const line = frontmatterLines[index];
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    if (key === "tags") {
      fields.push({ key, value: parseTagsValue(rawValue) });
      continue;
    }

    fields.push({ key, value: rawValue.replace(/^["']|["']$/g, "") });
  }

  return {
    fields,
    content: lines.slice(closingIndex + 1).join(lineEnding).trimStart()
  };
}
