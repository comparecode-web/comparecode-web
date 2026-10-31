import { BlockType, ChangeBlock, ChangeLine, ComparisonResult, DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { CompareSettings, PrecisionLevel } from "@/types/settings";
import { diffSequence, Edit } from "./diff/sequenceDiff";
import { alignLines } from "./diff/lineAlignment";
import { diffLines } from "./diff/lineDiff";
import { tokenize, tokenizeWhitespaceDelimited } from "./diff/tokenize";
import { crossLineCharacterDiff } from "./diff/crossLineCharacterDiff";
import { ComparisonNormalizer, Projection } from "./diff/comparisonNormalizer";

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

function appendToken(target: TextFragment[], source: string, projection: Projection | null, token: { start: number; end: number },
  cursor: number, kind: DiffChangeType): number {
  if (!projection) {
    appendFragment(target, source.slice(cursor, token.start), DiffChangeType.Unchanged);
    appendFragment(target, source.slice(token.start, token.end), kind);
    return token.end;
  }
  const { positions } = projection;
  let runStart = positions[token.start];
  let runEnd = runStart + 1;
  appendFragment(target, source.slice(cursor, runStart), DiffChangeType.Unchanged);
  for (let index = token.start + 1; index < token.end; index++) {
    const position = positions[index];
    if (position === runEnd) {
      runEnd++;
      continue;
    }
    appendFragment(target, source.slice(runStart, runEnd), kind);
    appendFragment(target, source.slice(runEnd, position), DiffChangeType.Unchanged);
    runStart = position;
    runEnd = position + 1;
  }
  appendFragment(target, source.slice(runStart, runEnd), kind);
  return runEnd;
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

function lineTokens(content: string, precision: PrecisionLevel, ignoreWord: boolean) {
  return precision === PrecisionLevel.Word && !ignoreWord
    ? tokenizeWhitespaceDelimited(content) : tokenize(content, precision).filter((token) => !ignoreWord || token.category !== "space");
}

function inlineDiff(oldLine: SourceLine, newLine: SourceLine, settings: CompareSettings, normalizer: ComparisonNormalizer): { old: ChangeLine; next: ChangeLine; limited: boolean } {
  if (oldLine.content.length + newLine.content.length > 50_000) {
    return { old: makeLine(oldLine, DiffChangeType.Deleted), next: makeLine(newLine, DiffChangeType.Inserted), limited: true };
  }
  const precision = settings.precision;
  const ignoreWord = normalizer.ignoresWhitespace && precision === PrecisionLevel.Word;
  if ((ignoreWord || normalizer.ignoresCase || normalizer.hasRules) && normalizer.contentKey(oldLine.content) === normalizer.contentKey(newLine.content)) {
    return { old: makeLine(oldLine, DiffChangeType.Deleted), next: makeLine(newLine, DiffChangeType.Inserted), limited: false };
  }
  const removeWhitespace = normalizer.ignoresWhitespace && !ignoreWord;
  const oldProjection = normalizer.project(oldLine.content, removeWhitespace);
  const newProjection = normalizer.project(newLine.content, removeWhitespace);
  const oldTokens = lineTokens(oldProjection?.text ?? oldLine.content, precision, ignoreWord);
  const newTokens = lineTokens(newProjection?.text ?? newLine.content, precision, ignoreWord);
  const oldKeys = oldTokens.map((token) => normalizer.tokenKey(token.text));
  const newKeys = newTokens.map((token) => normalizer.tokenKey(token.text));
  const result = diffSequence(oldKeys, newKeys, (a, b) => a === b, 80_000);
  const oldFragments: TextFragment[] = [], newFragments: TextFragment[] = [];
  let oi = 0, ni = 0, oldCursor = 0, newCursor = 0;
  const addOld = (kind: DiffChangeType) => {
    oldCursor = appendToken(oldFragments, oldLine.content, oldProjection, oldTokens[oi++], oldCursor, kind);
  };
  const addNew = (kind: DiffChangeType) => {
    newCursor = appendToken(newFragments, newLine.content, newProjection, newTokens[ni++], newCursor, kind);
  };
  for (const edit of result.edits) {
    if (edit === "equal") {
      addOld(DiffChangeType.Unchanged);
      addNew(DiffChangeType.Unchanged);
    } else if (edit === "delete") {
      addOld(DiffChangeType.Deleted);
    } else {
      addNew(DiffChangeType.Inserted);
    }
  }
  appendFragment(oldFragments, oldLine.content.slice(oldCursor), DiffChangeType.Unchanged);
  appendFragment(newFragments, newLine.content.slice(newCursor), DiffChangeType.Unchanged);
  const wordMode = precision === PrecisionLevel.Word && !normalizer.ignoresWhitespace;
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

function buildChunks(oldLines: SourceLine[], newLines: SourceLine[], edits: Edit[], normalizer: ComparisonNormalizer): Chunk[] {
  const entries: Array<{ edit: Edit; old?: SourceLine; next?: SourceLine; neutral: boolean }> = [];
  let oldIndex = 0, newIndex = 0;
  for (const edit of edits) {
    const old = edit !== "insert" ? oldLines[oldIndex++] : undefined;
    const next = edit !== "delete" ? newLines[newIndex++] : undefined;
    entries.push({ edit, old, next,
      neutral: edit === "equal" || normalizer.isIgnorable((old ?? next)!.content) });
  }
  if (normalizer.hasIgnorableLines) {
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
  if (!normalizer.hasIgnorableLines) return chunks;
  for (let index = 1; index < chunks.length - 1; index++) {
    const middle = chunks[index];
    if (!middle.neutral || chunks[index - 1].neutral || chunks[index + 1].neutral) continue;
    if (![...middle.old, ...middle.next].every((line) => normalizer.isIgnorable(line.content))) continue;
    const before = chunks[index - 1], after = chunks[index + 1];
    if (before.old.length && before.next.length && after.old.length && after.next.length) continue;
    before.old.push(...middle.old, ...after.old);
    before.next.push(...middle.next, ...after.next);
    chunks.splice(index, 2);
    index--;
  }
  return chunks;
}

function blockFromChunk(chunk: Chunk, oldText: string, newText: string, oldLines: SourceLine[], newLines: SourceLine[], settings: CompareSettings,
  normalizer: ComparisonNormalizer): { block: ChangeBlock; limited: boolean } {
  const kind = chunk.neutral ? BlockType.Unchanged : chunk.old.length && chunk.next.length ? BlockType.Modified : chunk.old.length ? BlockType.Removed : BlockType.Added;
  const oldStart = oldLines[chunk.oldIndex]?.start ?? oldText.length;
  const newStart = newLines[chunk.newIndex]?.start ?? newText.length;
  const block: ChangeBlock = {
    id: `diff-${chunk.oldIndex}-${chunk.newIndex}-${kind}`, kind,
    oldLines: chunk.old.map((line) => makeLine(line, kind === BlockType.Unchanged || normalizer.isIgnorable(line.content)
      ? DiffChangeType.Unchanged : DiffChangeType.Deleted)),
    newLines: chunk.next.map((line) => makeLine(line, kind === BlockType.Unchanged || normalizer.isIgnorable(line.content)
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
      const crossLine = crossLineCharacterDiff(chunk.old.map((line) => line.content), chunk.next.map((line) => line.content), normalizer);
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
        const inline = inlineDiff(old, next, settings, normalizer);
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

function moveSimilarity(oldText: string, newText: string, budget: number, normalizer: ComparisonNormalizer): { score: number; work: number } | null {
  const oldTokens = tokenize(normalizer.moveLineKey(oldText), PrecisionLevel.Word).filter((token) => token.category !== "space");
  const newTokens = tokenize(normalizer.moveLineKey(newText), PrecisionLevel.Word).filter((token) => token.category !== "space");
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

function detectMoves(blocks: ChangeBlock[], oldText: string, newText: string, normalizer: ComparisonNormalizer): void {
  const removed = blocks.filter((block) => block.kind === BlockType.Removed && block.oldLines.length >= 2);
  const added = blocks.filter((block) => block.kind === BlockType.Added && block.newLines.length >= 2);
  if (!removed.length || !added.length || removed.length * added.length > 50_000 || removed.length > 250 || added.length > 250) return;
  const countLines = (text: string) => {
    const counts = new Map<string, number>();
    for (const line of splitLines(text)) {
      const key = normalizer.moveLineKey(line.content);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  };
  const oldFrequency = countLines(oldText), newFrequency = countLines(newText);
  const used = new Set<string>();
  let similarityBudget = 400_000;
  for (const source of removed) {
    const sourceText = oldText.slice(source.startOffsetOld, source.endOffsetOld);
    const sourceKey = normalizer.textKey(sourceText);
    if (sourceKey.length < 20) continue;
    if (removed.filter((candidate) => {
      const candidateText = oldText.slice(candidate.startOffsetOld, candidate.endOffsetOld);
      return normalizer.textKey(candidateText) === sourceKey;
    }).length !== 1) continue;
    const matches = added.filter((target) => {
      if (used.has(target.id)) return false;
      const targetText = newText.slice(target.startOffsetNew, target.endOffsetNew);
      return sourceKey === normalizer.textKey(targetText);
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
    const sourceLines = source.oldLines.map((line) => normalizer.moveLineKey(line.fragments.map((fragment) => fragment.text).join("")));
    const meaningful = new Set(sourceLines.filter((line) => line.length >= 8));
    if (meaningful.size < 2) continue;
    if (removed.some((other) => other !== source && other.oldLines.map((line) =>
      normalizer.moveLineKey(line.fragments.map((fragment) => fragment.text).join(""))).join("\n") === sourceLines.join("\n"))) continue;
    const candidates = added.filter((target) => !used.has(target.id) && target.newLines.length >= 3).map((target) => {
      const targetLines = target.newLines.map((line) => normalizer.moveLineKey(line.fragments.map((fragment) => fragment.text).join("")));
      const shared = targetLines.filter((line) => meaningful.has(line)).length;
      const uniqueShared = targetLines.filter((line) => meaningful.has(line) && oldFrequency.get(line) === 1 && newFrequency.get(line) === 1).length;
      if (shared < 2 || uniqueShared < 2 || similarityBudget <= 0) return null;
      const similarity = moveSimilarity(oldText.slice(source.startOffsetOld, source.endOffsetOld),
        newText.slice(target.startOffsetNew, target.endOffsetNew), Math.min(20_000, similarityBudget), normalizer);
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
    const normalizer = new ComparisonNormalizer(settings);
    const oldLines = splitLines(oldText), newLines = splitLines(newText);
    const edits = diffLines(oldLines.map((line) => normalizer.lineKey(line.content, line.raw)),
      newLines.map((line) => normalizer.lineKey(line.content, line.raw)));
    const chunks = buildChunks(oldLines, newLines, edits.edits, normalizer);
    let limited = edits.limited;
    const blocks = chunks.map((chunk) => {
      const built = blockFromChunk(chunk, oldText, newText, oldLines, newLines, settings, normalizer);
      limited ||= built.limited;
      return built.block;
    });
    if (!limited) detectMoves(blocks, oldText, newText, normalizer);
    return { blocks, limited };
  }
}
