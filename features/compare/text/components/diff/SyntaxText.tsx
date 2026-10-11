import type { SyntaxKind, SyntaxLine } from "../../services/syntax/tokenizeSyntax";

const tokenClasses: Record<SyntaxKind, string> = {
  comment: "text-syntax-comment", string: "text-syntax-string", number: "text-syntax-number",
  keyword: "text-syntax-keyword", type: "text-syntax-type", punctuation: "text-syntax-punctuation", property: "text-syntax-property"
};

export function SyntaxText({ text, offset, line, preserveDiffColor }: {
  text: string; offset: number; line: SyntaxLine; preserveDiffColor: boolean;
}) {
  const end = offset + text.length;
  const pieces = [];
  let cursor = offset;
  let low = 0;
  let high = line.tokens.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (line.tokens[middle].end <= offset) low = middle + 1;
    else high = middle;
  }
  for (let index = low; index < line.tokens.length; index++) {
    const token = line.tokens[index];
    if (token.end <= cursor) continue;
    if (token.start >= end) break;
    const tokenStart = Math.max(cursor, token.start);
    const tokenEnd = Math.min(end, token.end);
    if (tokenStart > cursor) pieces.push(text.slice(cursor - offset, tokenStart - offset));
    pieces.push(<span key={tokenStart} data-syntax-kind={token.kind} className={preserveDiffColor ? "text-inherit" : tokenClasses[token.kind]}>{text.slice(tokenStart - offset, tokenEnd - offset)}</span>);
    cursor = tokenEnd;
  }
  if (cursor < end) pieces.push(text.slice(cursor - offset));
  return <>{pieces}</>;
}
