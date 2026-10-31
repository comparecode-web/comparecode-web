import { TextTransformError } from "./textTransforms";

export type JsonIndent = "2" | "4" | "tab";

export interface JsonTransformResult {
  text: string;
  warning?: string;
}

type JsonNode =
  | { kind: "literal"; raw: string }
  | { kind: "array"; items: JsonNode[] }
  | { kind: "object"; members: JsonMember[] };

interface JsonMember {
  rawKey: string;
  key: string;
  value: JsonNode;
}

interface Frame {
  node: Extract<JsonNode, { kind: "array" | "object" }>;
  keys?: Set<string>;
  pendingKey?: { raw: string; key: string };
}

export const JSON_INPUT_LIMIT = 5 * 1024 * 1024;
export const JSON_OUTPUT_LIMIT = 20 * 1024 * 1024;

const NUMBER = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y;
const ESCAPES = "\"\\/bfnrt";
const HEX4 = /^[0-9a-fA-F]{4}$/;

function position(source: string, index: number): string {
  let line = 1, lineStart = 0;
  for (let cursor = 0; cursor < index; cursor++) {
    const code = source.charCodeAt(cursor);
    if (code === 10 || (code === 13 && source.charCodeAt(cursor + 1) !== 10)) {
      line++;
      lineStart = cursor + 1;
    }
  }
  return `line ${line}, column ${index - lineStart + 1}`;
}

function parseJson(source: string): { root: JsonNode; duplicates: number } {
  if (source.length > JSON_INPUT_LIMIT) throw new TextTransformError("JSON larger than 5 MB cannot be formatted.");
  const offset = source.charCodeAt(0) === 0xFEFF ? 1 : 0;
  const text = offset ? source.slice(1) : source;
  const length = text.length;
  let index = 0;
  let duplicates = 0;
  const fail = (reason: string, at = index): never => {
    throw new TextTransformError(`Invalid JSON at ${position(source, Math.min(at, length) + offset)}: ${reason}.`);
  };
  const skipWhitespace = () => {
    while (index < length) {
      const code = text.charCodeAt(index);
      if (code === 32 || code === 9 || code === 10 || code === 13) index++;
      else if (code === 47 && (text[index + 1] === "/" || text[index + 1] === "*")) fail("comments are not allowed in JSON");
      else break;
    }
  };
  const readString = (): string => {
    const start = index++;
    for (;;) {
      if (index >= length) fail("unterminated string", start);
      const code = text.charCodeAt(index);
      if (code === 34) return text.slice(start, ++index);
      if (code === 92) {
        const next = text[index + 1];
        if (next !== undefined && ESCAPES.includes(next)) index += 2;
        else if (next === "u" && HEX4.test(text.slice(index + 2, index + 6))) index += 6;
        else fail("invalid escape sequence");
      } else if (code < 32) {
        fail("control characters must be escaped in strings");
      } else {
        index++;
      }
    }
  };
  const readLiteral = (): JsonNode => {
    const character = text[index];
    if (character === "\"") return { kind: "literal", raw: readString() };
    for (const word of ["true", "false", "null"]) {
      if (text.startsWith(word, index)) {
        index += word.length;
        return { kind: "literal", raw: word };
      }
    }
    NUMBER.lastIndex = index;
    const match = NUMBER.exec(text);
    if (!match) fail(character === "'" ? "strings must use double quotes" : `unexpected character "${character}"`);
    index += match![0].length;
    return { kind: "literal", raw: match![0] };
  };

  const stack: Frame[] = [];
  let root: JsonNode | undefined;
  const attach = (node: JsonNode) => {
    const top = stack[stack.length - 1];
    if (!top) root = node;
    else if (top.node.kind === "array") top.node.items.push(node);
    else {
      top.node.members.push({ rawKey: top.pendingKey!.raw, key: top.pendingKey!.key, value: node });
      top.pendingKey = undefined;
    }
  };

  let mode: "value" | "key" | "after" = "value";
  for (;;) {
    skipWhitespace();
    if (mode === "value") {
      if (index >= length) fail(root === undefined && !stack.length ? "there is no JSON to format" : "unexpected end of JSON");
      const character = text[index];
      if (character === "{" || character === "[") {
        const node: Frame["node"] = character === "{" ? { kind: "object", members: [] } : { kind: "array", items: [] };
        attach(node);
        stack.push(node.kind === "object" ? { node, keys: new Set() } : { node });
        index++;
        skipWhitespace();
        if (text[index] === (character === "{" ? "}" : "]")) {
          index++;
          stack.pop();
          mode = "after";
        } else {
          mode = character === "{" ? "key" : "value";
        }
        continue;
      }
      if (character === "]" || character === "}") fail(stack.length ? "trailing commas are not allowed in JSON" : `unexpected "${character}"`);
      attach(readLiteral());
      mode = "after";
      continue;
    }
    if (mode === "key") {
      if (text[index] !== "\"") fail(text[index] === "}" ? "trailing commas are not allowed in JSON" : "expected a property name in double quotes");
      const raw = readString();
      const key = JSON.parse(raw) as string;
      const top = stack[stack.length - 1];
      if (top.keys!.has(key)) duplicates++;
      else top.keys!.add(key);
      top.pendingKey = { raw, key };
      skipWhitespace();
      if (text[index] !== ":") fail("expected \":\" after a property name");
      index++;
      mode = "value";
      continue;
    }
    const top = stack[stack.length - 1];
    if (!top) {
      if (index < length) fail("unexpected content after the JSON value");
      return { root: root!, duplicates };
    }
    const close = top.node.kind === "object" ? "}" : "]";
    if (text[index] === ",") {
      index++;
      mode = top.node.kind === "object" ? "key" : "value";
    } else if (text[index] === close) {
      index++;
      stack.pop();
    } else {
      fail(index >= length ? "unexpected end of JSON" : `expected "," or "${close}"`);
    }
  }
}

function sortMembers(root: JsonNode): void {
  const pending: JsonNode[] = [root];
  while (pending.length) {
    const node = pending.pop()!;
    if (node.kind === "array") pending.push(...node.items);
    else if (node.kind === "object") {
      node.members.sort((a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
      for (const member of node.members) pending.push(member.value);
    }
  }
}

function serialize(root: JsonNode, indent: string | null, lineEnding: string): string {
  const parts: string[] = [];
  let size = 0;
  const write = (part: string) => {
    size += part.length;
    if (size > JSON_OUTPUT_LIMIT) throw new TextTransformError("The formatted JSON would be larger than 20 MB.");
    parts.push(part);
  };
  const frames: Array<{ node: Frame["node"]; index: number; depth: number }> = [];
  const open = (node: JsonNode, depth: number) => {
    if (node.kind === "literal") return write(node.raw);
    const empty = node.kind === "array" ? !node.items.length : !node.members.length;
    if (empty) return write(node.kind === "array" ? "[]" : "{}");
    write(node.kind === "array" ? "[" : "{");
    frames.push({ node, index: 0, depth });
  };
  open(root, 0);
  while (frames.length) {
    const frame = frames[frames.length - 1];
    const count = frame.node.kind === "array" ? frame.node.items.length : frame.node.members.length;
    if (frame.index >= count) {
      frames.pop();
      if (indent !== null) write(lineEnding + indent.repeat(frame.depth));
      write(frame.node.kind === "array" ? "]" : "}");
      continue;
    }
    if (frame.index > 0) write(",");
    if (indent !== null) write(lineEnding + indent.repeat(frame.depth + 1));
    const position = frame.index++;
    if (frame.node.kind === "array") open(frame.node.items[position], frame.depth + 1);
    else {
      const member = frame.node.members[position];
      write(member.rawKey + (indent !== null ? ": " : ":"));
      open(member.value, frame.depth + 1);
    }
  }
  return parts.join("");
}

function finish(source: string, root: JsonNode, duplicates: number, indent: string | null): JsonTransformResult {
  const lineEnding = source.includes("\r\n") ? "\r\n" : "\n";
  const trailing = indent !== null && /(?:\r\n|\r|\n)\s*$/u.test(source) ? lineEnding : "";
  const text = serialize(root, indent, lineEnding) + trailing;
  return duplicates
    ? { text, warning: duplicates === 1 ? "The JSON contains a duplicate property name. Both values are kept." : `The JSON contains ${duplicates} duplicate property names. All values are kept.` }
    : { text };
}

const INDENTS: Record<JsonIndent, string> = { "2": "  ", "4": "    ", tab: "\t" };

export function formatJson(source: string, indent: JsonIndent = "2"): JsonTransformResult {
  const { root, duplicates } = parseJson(source);
  return finish(source, root, duplicates, INDENTS[indent]);
}

export function minifyJson(source: string): JsonTransformResult {
  const { root, duplicates } = parseJson(source);
  return finish(source, root, duplicates, null);
}

export function sortJsonKeys(source: string): JsonTransformResult {
  const { root, duplicates } = parseJson(source);
  sortMembers(root);
  return finish(source, root, duplicates, INDENTS["2"]);
}
