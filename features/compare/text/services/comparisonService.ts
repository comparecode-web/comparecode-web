import { BlockType, ChangeBlock, ChangeLine, ComparisonResult, DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { CompareSettings, PrecisionLevel } from "@/types/settings";
import { diffSequence, Edit } from "./diff/sequenceDiff";
import { alignLines } from "./diff/lineAlignment";
import { diffLines } from "./diff/lineDiff";
import { normalizeWhitespace, tokenize, tokenizeWhitespaceDelimited } from "./diff/tokenize";
import { crossLineCharacterDiff } from "./diff/crossLineCharacterDiff";

interface SourceLine { content: string; raw: string; start: number; end: number; number: number }
interface Chunk { neutral: boolean; old: SourceLine[]; next: SourceLine[]; oldIndex: number; newIndex: number }

function splitLines(text: string): SourceLine[] {
  if (!text) return [];
  const result: SourceLine[] = [];
  let start = 0;
  for (const match of text.matchAll(/\r\n|\r|\n/g)) {
    const end = match.index + match[0].length;
    result.push({ content: text.slice(start, match.index), raw: text.slice(start, end), start, end, number: result.length + 1 });
    start = end;
  }
  if (start < text.length) result.push({ content: text.slice(start), raw: text.slice(start), start, end: text.length, number: result.length + 1 });
  return result;
}

function makeLine(line: SourceLine, kind: DiffChangeType, fragments?: TextFragment[]): ChangeLine {
  return { lineNumber: line.number, kind,
    fragments: fragments ?? [{ kind: DiffChangeType.Unchanged, text: line.content }] };
}

function endingLabel(line: SourceLine): string {
  const ending = line.raw.slice(line.content.length);
  return ending === "\r\n" ? "CRLF" : ending === "\r" ? "CR" : ending === "\n" ? "LF" : "No line ending";
}

function appendFragment(target: TextFragment[], text: string, kind: DiffChangeType): void {
  if (!text) return;
  const previous = target.at(-1);
  if (previous?.kind === kind) previous.text += text;
  else target.push({ text, kind });
}

function contentProjection(text: string): { text: string; positions: number[] } {
  let content = "";
  const positions: number[] = [];
  for (const match of text.matchAll(/\S/gu)) {
    content += match[0];
    for (let index = 0; index < match[0].length; index++) positions.push(match.index + index);
  }
  return { text: content, positions };
}

function appendProjectedToken(target: TextFragment[], source: string, positions: number[], token: { start: number; end: number },
  cursor: number, kind: DiffChangeType): number {
  const start = positions[token.start];
  const end = positions[token.end - 1] + 1;
  appendFragment(target, source.slice(cursor, start), DiffChangeType.Unchanged);
  for (const part of source.slice(start, end).match(/\s+|\S+/gu) ?? []) {
    appendFragment(target, part, /^\s+$/u.test(part) ? DiffChangeType.Unchanged : kind);
  }
  return end;
}

function normalizeWordFragments(fragments: TextFragment[], changedKind: DiffChangeType): TextFragment[] {
  const normalized = fragments.map((fragment) => ({ ...fragment }));
  const hasWord = (text: string) => /[\p{L}\p{N}_]/u.test(text);
  for (let index = 1; index < normalized.length - 1; index++) {
    const previous = normalized[index - 1], current = normalized[index], next = normalized[index + 1];
    if (current.kind === DiffChangeType.Unchanged && /^\s+$/u.test(current.text) &&
      previous.kind === changedKind && next.kind === changedKind &&
      hasWord(previous.text) && hasWord(next.text)) current.kind = changedKind;
  }
  for (let index = 0; index < normalized.length - 1; index++) {
    const current = normalized[index], next = normalized[index + 1];
    if (current.kind !== changedKind || next.kind !== DiffChangeType.Unchanged || /^\s/u.test(next.text)) continue;
    const trailing = current.text.match(/\s+$/u)?.[0];
    if (!trailing) continue;
    current.text = current.text.slice(0, -trailing.length);
    next.text = trailing + next.text;
  }
  return normalized.filter((fragment) => fragment.text.length > 0);
}

function inlineDiff(oldLine: SourceLine, newLine: SourceLine, settings: CompareSettings): { old: ChangeLine; next: ChangeLine; limited: boolean } {
  if (oldLine.content.length + newLine.content.length > 50_000) {
    return { old: makeLine(oldLine, DiffChangeType.Deleted), next: makeLine(newLine, DiffChangeType.Inserted), limited: true };
  }
  const ignoreWord = settings.ignoreWhitespace && settings.precision === PrecisionLevel.Word;
  if (ignoreWord && normalizeWhitespace(oldLine.content) === normalizeWhitespace(newLine.content)) {
    return { old: makeLine(oldLine, DiffChangeType.Deleted), next: makeLine(newLine, DiffChangeType.Inserted), limited: false };
  }
  const oldProjection = settings.ignoreWhitespace && !ignoreWord ? contentProjection(oldLine.content) : null;
  const newProjection = settings.ignoreWhitespace && !ignoreWord ? contentProjection(newLine.content) : null;
  const oldContent = oldProjection?.text ?? oldLine.content;
  const newContent = newProjection?.text ?? newLine.content;
  const precision = settings.precision;
  const oldTokens = precision === PrecisionLevel.Word && !ignoreWord
    ? tokenizeWhitespaceDelimited(oldContent) : tokenize(oldContent, precision).filter((token) => !ignoreWord || token.category !== "space");
  const newTokens = precision === PrecisionLevel.Word && !ignoreWord
    ? tokenizeWhitespaceDelimited(newContent) : tokenize(newContent, precision).filter((token) => !ignoreWord || token.category !== "space");
  const result = diffSequence(oldTokens, newTokens, (a, b) => a.text === b.text, 80_000);
  const oldFragments: TextFragment[] = [], newFragments: TextFragment[] = [];
  let oi = 0, ni = 0, oldCursor = 0, newCursor = 0;
  const addOld = (token: typeof oldTokens[number], kind: DiffChangeType) => {
    if (oldProjection) oldCursor = appendProjectedToken(oldFragments, oldLine.content, oldProjection.positions, token, oldCursor, kind);
    else if (ignoreWord) {
      appendFragment(oldFragments, oldLine.content.slice(oldCursor, token.start), DiffChangeType.Unchanged);
      appendFragment(oldFragments, token.text, kind);
      oldCursor = token.end;
    }
    else appendFragment(oldFragments, token.text, kind);
  };
  const addNew = (token: typeof newTokens[number], kind: DiffChangeType) => {
    if (newProjection) newCursor = appendProjectedToken(newFragments, newLine.content, newProjection.positions, token, newCursor, kind);
    else if (ignoreWord) {
      appendFragment(newFragments, newLine.content.slice(newCursor, token.start), DiffChangeType.Unchanged);
      appendFragment(newFragments, token.text, kind);
      newCursor = token.end;
    }
    else appendFragment(newFragments, token.text, kind);
  };
  for (const edit of result.edits) {
    if (edit === "equal") {
      addOld(oldTokens[oi++], DiffChangeType.Unchanged);
      addNew(newTokens[ni++], DiffChangeType.Unchanged);
    } else if (edit === "delete") {
      addOld(oldTokens[oi++], DiffChangeType.Deleted);
    } else {
      addNew(newTokens[ni++], DiffChangeType.Inserted);
    }
  }
  if (oldProjection) appendFragment(oldFragments, oldLine.content.slice(oldCursor), DiffChangeType.Unchanged);
  if (newProjection) appendFragment(newFragments, newLine.content.slice(newCursor), DiffChangeType.Unchanged);
  if (ignoreWord) {
    appendFragment(oldFragments, oldLine.content.slice(oldCursor), DiffChangeType.Unchanged);
    appendFragment(newFragments, newLine.content.slice(newCursor), DiffChangeType.Unchanged);
  }
  const wordMode = precision === PrecisionLevel.Word && !settings.ignoreWhitespace;
  const old = makeLine(oldLine, DiffChangeType.Deleted,
    wordMode ? normalizeWordFragments(oldFragments, DiffChangeType.Deleted) : oldFragments);
  const next = makeLine(newLine, DiffChangeType.Inserted,
    wordMode ? normalizeWordFragments(newFragments, DiffChangeType.Inserted) : newFragments);
  if (oldLine.raw.slice(oldLine.content.length) !== newLine.raw.slice(newLine.content.length)) {
    old.lineEndingLabel = endingLabel(oldLine);
    next.lineEndingLabel = endingLabel(newLine);
  }
  return { old, next, limited: result.limited };
}

function buildChunks(oldLines: SourceLine[], newLines: SourceLine[], edits: Edit[], ignoreWhitespace: boolean): Chunk[] {
  const entries: Array<{ edit: Edit; old?: SourceLine; next?: SourceLine; neutral: boolean }> = [];
  let oldIndex = 0, newIndex = 0;
  for (const edit of edits) {
    const old = edit !== "insert" ? oldLines[oldIndex++] : undefined;
    const next = edit !== "delete" ? newLines[newIndex++] : undefined;
    entries.push({ edit, old, next,
      neutral: edit === "equal" || (ignoreWhitespace && normalizeWhitespace((old ?? next)!.content) === "") });
  }
  if (ignoreWhitespace) {
    for (let index = 1; index < entries.length - 1; index++) {
      const entry = entries[index];
      if (entry.edit === "equal" || !entry.neutral) continue;
      let before = index - 1, after = index + 1;
      while (before >= 0 && entries[before].edit === entry.edit && entries[before].neutral) before--;
      while (after < entries.length && entries[after].edit === entry.edit && entries[after].neutral) after++;
      if (before >= 0 && after < entries.length && entries[before].edit === entry.edit &&
        entries[after].edit === entry.edit) entry.neutral = false;
    }
  }
  const chunks: Chunk[] = [];
  let oi = 0, ni = 0;
  for (const { old, next, neutral } of entries) {
    if (old) oi++;
    if (next) ni++;
    const previous = chunks.at(-1);
    const chunk: Chunk = previous?.neutral === neutral ? previous : { neutral, old: [], next: [], oldIndex: oi - (old ? 1 : 0), newIndex: ni - (next ? 1 : 0) };
    if (chunk !== previous) chunks.push(chunk);
    if (old) chunk.old.push(old);
    if (next) chunk.next.push(next);
  }
  if (!ignoreWhitespace) return chunks;
  for (let index = 1; index < chunks.length - 1; index++) {
    const middle = chunks[index];
    if (!middle.neutral || chunks[index - 1].neutral || chunks[index + 1].neutral) continue;
    if (![...middle.old, ...middle.next].every((line) => normalizeWhitespace(line.content) === "")) continue;
    const before = chunks[index - 1], after = chunks[index + 1];
    if (before.old.length && before.next.length && after.old.length && after.next.length) continue;
    before.old.push(...middle.old, ...after.old);
    before.next.push(...middle.next, ...after.next);
    chunks.splice(index, 2);
    index--;
  }
  return chunks;
}

function blockFromChunk(chunk: Chunk, oldText: string, newText: string, oldLines: SourceLine[], newLines: SourceLine[], settings: CompareSettings): { block: ChangeBlock; limited: boolean } {
  const kind = chunk.neutral ? BlockType.Unchanged : chunk.old.length && chunk.next.length ? BlockType.Modified : chunk.old.length ? BlockType.Removed : BlockType.Added;
  const oldStart = oldLines[chunk.oldIndex]?.start ?? oldText.length;
  const newStart = newLines[chunk.newIndex]?.start ?? newText.length;
  const block: ChangeBlock = {
    id: `diff-${chunk.oldIndex}-${chunk.newIndex}-${kind}`, kind,
    oldLines: chunk.old.map((line) => makeLine(line, kind === BlockType.Unchanged || (settings.ignoreWhitespace && !normalizeWhitespace(line.content))
      ? DiffChangeType.Unchanged : DiffChangeType.Deleted)),
    newLines: chunk.next.map((line) => makeLine(line, kind === BlockType.Unchanged || (settings.ignoreWhitespace && !normalizeWhitespace(line.content))
      ? DiffChangeType.Unchanged : DiffChangeType.Inserted)),
    startIndexOld: chunk.oldIndex, startIndexNew: chunk.newIndex,
    startOffsetOld: oldStart, endOffsetOld: chunk.old.at(-1)?.end ?? oldStart,
    startOffsetNew: newStart, endOffsetNew: chunk.next.at(-1)?.end ?? newStart,
    removalCount: kind === BlockType.Removed || kind === BlockType.Modified ? chunk.old.length : 0,
    additionCount: kind === BlockType.Added || kind === BlockType.Modified ? chunk.next.length : 0,
  };
  let limited = false;
  if (kind === BlockType.Modified) {
    if (settings.precision === PrecisionLevel.Character && chunk.old.length !== chunk.next.length) {
      const crossLine = crossLineCharacterDiff(chunk.old.map((line) => line.content), chunk.next.map((line) => line.content), settings.ignoreWhitespace);
      if (crossLine) {
        block.oldLines = chunk.old.map((line, index) => makeLine(line, DiffChangeType.Deleted, crossLine.old[index]));
        block.newLines = chunk.next.map((line, index) => makeLine(line, DiffChangeType.Inserted, crossLine.next[index]));
        return { block, limited };
      }
      limited = true;
    }
    const oversized = [...chunk.old, ...chunk.next].some((line) => line.content.length > 50_000);
    const alignment = oversized ? { pairs: Array.from({ length: Math.max(chunk.old.length, chunk.next.length) }, (_, index) => ({
      oldIndex: index < chunk.old.length ? index : null, newIndex: index < chunk.next.length ? index : null
    })), limited: true } : alignLines(chunk.old.map((line) => line.content), chunk.next.map((line) => line.content));
    limited ||= alignment.limited;
    block.removalCount = alignment.pairs.length;
    block.additionCount = alignment.pairs.length;
    block.oldLines = [];
    block.newLines = [];
    for (const pair of alignment.pairs) {
      const old = pair.oldIndex === null ? undefined : chunk.old[pair.oldIndex];
      const next = pair.newIndex === null ? undefined : chunk.next[pair.newIndex];
      if (old && next && !alignment.limited) {
        const inline = inlineDiff(old, next, settings);
        block.oldLines.push(inline.old);
        block.newLines.push(inline.next);
        limited ||= inline.limited;
      } else {
        block.oldLines.push(old ? makeLine(old, DiffChangeType.Deleted,
          [{ kind: DiffChangeType.Deleted, text: old.content }]) : { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [] });
        block.newLines.push(next ? makeLine(next, DiffChangeType.Inserted,
          [{ kind: DiffChangeType.Inserted, text: next.content }]) : { lineNumber: null, kind: DiffChangeType.Imaginary, fragments: [] });
      }
    }
  }
  return { block, limited };
}

function moveSimilarity(oldText: string, newText: string, budget: number): { score: number; work: number } | null {
  const oldTokens = tokenize(normalizeWhitespace(oldText), PrecisionLevel.Word).filter((token) => token.category !== "space");
  const newTokens = tokenize(normalizeWhitespace(newText), PrecisionLevel.Word).filter((token) => token.category !== "space");
  if (oldTokens.length + newTokens.length > 1_200 || !oldTokens.length || !newTokens.length) return null;
  const result = diffSequence(oldTokens, newTokens, (oldToken, newToken) => oldToken.text === newToken.text, budget);
  if (result.limited) return null;
  let oldIndex = 0, matchedCharacters = 0;
  for (const edit of result.edits) {
    if (edit === "equal") {
      matchedCharacters += oldTokens[oldIndex].text.length;
      oldIndex++;
    } else if (edit === "delete") oldIndex++;
  }
  const totalCharacters = oldTokens.reduce((sum, token) => sum + token.text.length, 0) +
    newTokens.reduce((sum, token) => sum + token.text.length, 0);
  return { score: 2 * matchedCharacters / totalCharacters, work: result.work };
}

function detectMoves(blocks: ChangeBlock[], oldText: string, newText: string, ignoreWhitespace: boolean): void {
  const removed = blocks.filter((block) => block.kind === BlockType.Removed && block.oldLines.length >= 2);
  const added = blocks.filter((block) => block.kind === BlockType.Added && block.newLines.length >= 2);
  if (!removed.length || !added.length || removed.length * added.length > 50_000 || removed.length > 250 || added.length > 250) return;
  const countLines = (text: string) => {
    const counts = new Map<string, number>();
    for (const line of splitLines(text)) {
      const key = normalizeWhitespace(line.content);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  };
  const oldFrequency = countLines(oldText), newFrequency = countLines(newText);
  const used = new Set<string>();
  let similarityBudget = 400_000;
  for (const source of removed) {
    const sourceText = oldText.slice(source.startOffsetOld, source.endOffsetOld);
    const sourceKey = ignoreWhitespace ? normalizeWhitespace(sourceText) : sourceText;
    if (sourceKey.length < 20) continue;
    if (removed.filter((candidate) => {
      const candidateText = oldText.slice(candidate.startOffsetOld, candidate.endOffsetOld);
      return (ignoreWhitespace ? normalizeWhitespace(candidateText) : candidateText) === sourceKey;
    }).length !== 1) continue;
    const matches = added.filter((target) => {
      if (used.has(target.id)) return false;
      const targetText = newText.slice(target.startOffsetNew, target.endOffsetNew);
      return sourceKey === (ignoreWhitespace ? normalizeWhitespace(targetText) : targetText);
    });
    if (matches.length !== 1) continue;
    const target = matches[0];
    used.add(target.id);
    const id = `move-${source.id}-${target.id}`;
    source.move = { id, role: "from", counterpartStartLine: target.startIndexNew + 1, counterpartEndLine: target.startIndexNew + target.newLines.length, counterpartBlockId: target.id, modified: false };
    target.move = { id, role: "to", counterpartStartLine: source.startIndexOld + 1, counterpartEndLine: source.startIndexOld + source.oldLines.length, counterpartBlockId: source.id, modified: false };
  }

  for (const source of removed) {
    if (source.move || source.oldLines.length < 3) continue;
    const sourceLines = source.oldLines.map((line) => normalizeWhitespace(line.fragments.map((fragment) => fragment.text).join("")));
    const meaningful = new Set(sourceLines.filter((line) => line.length >= 8));
    if (meaningful.size < 2) continue;
    if (removed.some((other) => other !== source && other.oldLines.map((line) =>
      normalizeWhitespace(line.fragments.map((fragment) => fragment.text).join(""))).join("\n") === sourceLines.join("\n"))) continue;
    const candidates = added.filter((target) => !used.has(target.id) && target.newLines.length >= 3).map((target) => {
      const targetLines = target.newLines.map((line) => normalizeWhitespace(line.fragments.map((fragment) => fragment.text).join("")));
      const shared = targetLines.filter((line) => meaningful.has(line)).length;
      const uniqueShared = targetLines.filter((line) => meaningful.has(line) && oldFrequency.get(line) === 1 && newFrequency.get(line) === 1).length;
      if (shared < 2 || uniqueShared < 2 || similarityBudget <= 0) return null;
      const similarity = moveSimilarity(oldText.slice(source.startOffsetOld, source.endOffsetOld),
        newText.slice(target.startOffsetNew, target.endOffsetNew), Math.min(20_000, similarityBudget));
      similarityBudget -= similarity?.work ?? 20_000;
      const minimumSimilarity = uniqueShared >= 4 ? 0.45 : 0.6;
      return similarity && similarity.score >= minimumSimilarity ? { target, score: similarity.score } : null;
    }).filter((candidate): candidate is { target: ChangeBlock; score: number } => candidate !== null)
      .sort((a, b) => b.score - a.score);
    if (!candidates.length || (candidates[1] && candidates[0].score - candidates[1].score < 0.15)) continue;
    const target = candidates[0].target;
    used.add(target.id);
    const id = `move-${source.id}-${target.id}`;
    source.move = { id, role: "from", counterpartStartLine: target.startIndexNew + 1, counterpartEndLine: target.startIndexNew + target.newLines.length, counterpartBlockId: target.id, modified: true };
    target.move = { id, role: "to", counterpartStartLine: source.startIndexOld + 1, counterpartEndLine: source.startIndexOld + source.oldLines.length, counterpartBlockId: source.id, modified: true };
  }
  const byId = new Map(blocks.map((block) => [block.id, block]));
  let number = 1;
  for (const source of removed) {
    if (!source.move) continue;
    source.move.number = number;
    const counterpart = byId.get(source.move.counterpartBlockId);
    if (counterpart?.move) counterpart.move.number = number;
    number++;
  }
}

export class ComparisonService {
  public static compare(oldText: string, newText: string, settings: CompareSettings): ComparisonResult {
    const oldLines = splitLines(oldText), newLines = splitLines(newText);
    const edits = diffLines(oldLines.map((line) => settings.ignoreWhitespace ? normalizeWhitespace(line.content) : line.raw),
      newLines.map((line) => settings.ignoreWhitespace ? normalizeWhitespace(line.content) : line.raw));
    const chunks = buildChunks(oldLines, newLines, edits.edits, settings.ignoreWhitespace);
    let limited = edits.limited;
    const blocks = chunks.map((chunk) => {
      const built = blockFromChunk(chunk, oldText, newText, oldLines, newLines, settings);
      limited ||= built.limited;
      return built.block;
    });
    if (!limited) detectMoves(blocks, oldText, newText, settings.ignoreWhitespace);
    return { blocks, limited };
  }
}
