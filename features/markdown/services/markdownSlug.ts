const footnoteSlugPattern = /^(?:fn-|fnref-|footnote-label$)/;

export function toMarkdownSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replace(/ /g, "-");
}

export function createMarkdownSlugger() {
  const counts = new Map<string, number>();
  const used = new Set<string>();

  return (text: string): string => {
    const slug = toMarkdownSlug(text) || "heading";
    const base = footnoteSlugPattern.test(slug) ? `section-${slug}` : slug;
    let count = counts.get(base) ?? 0;
    let candidate = count === 0 ? base : `${base}-${count}`;

    while (used.has(candidate)) {
      count += 1;
      candidate = `${base}-${count}`;
    }

    counts.set(base, count + 1);
    used.add(candidate);
    return candidate;
  };
}
