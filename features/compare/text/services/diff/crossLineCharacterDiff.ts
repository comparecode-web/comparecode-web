import { DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { Token, tokenize } from "./tokenize";
import { PrecisionLevel } from "@/types/settings";
import { diffSequence } from "./sequenceDiff";
import { ComparisonNormalizer } from "./comparisonNormalizer";

type Match = { oldStart: number; newStart: number; length: number };

function append(target: TextFragment[], text: string, kind: DiffChangeType): void {
  if (!text) return;
  const last = target.at(-1);
  if (last?.kind === kind) last.text += text;
  else target.push({ text, kind });
}

function longestMatch(old: string[], next: string[], oldStart: number, oldEnd: number, newStart: number, newEnd: number): Match {
  const previous = new Uint32Array(newEnd - newStart + 1);
  const current = new Uint32Array(previous.length);
  let best: Match = { oldStart, newStart, length: 0 };
  for (let oi = oldStart; oi < oldEnd; oi++) {
    current.fill(0);
    for (let ni = newStart; ni < newEnd; ni++) {
      const index = ni - newStart + 1;
      if (old[oi] !== next[ni]) continue;
      const length = previous[index - 1] + 1;
      current[index] = length;
      if (length > best.length) best = { oldStart: oi - length + 1, newStart: ni - length + 1, length };
    }
    previous.set(current);
  }
  return best;
}

function stableMatches(old: string[], next: string[]): Match[] | null {
  const pending = [{ oldStart: 0, oldEnd: old.length, newStart: 0, newEnd: next.length }];
  const matches: Match[] = [];
  let work = 0;
  while (pending.length) {
    const segment = pending.pop()!;
    work += (segment.oldEnd - segment.oldStart) * (segment.newEnd - segment.newStart);
    if (work > 400_000) return null;
    const match = longestMatch(old, next, segment.oldStart, segment.oldEnd, segment.newStart, segment.newEnd);
    if (match.length < 4) continue;
    matches.push(match);
    pending.push({ oldStart: segment.oldStart, oldEnd: match.oldStart, newStart: segment.newStart, newEnd: match.newStart });
    pending.push({ oldStart: match.oldStart + match.length, oldEnd: segment.oldEnd,
      newStart: match.newStart + match.length, newEnd: segment.newEnd });
  }
  return matches.sort((a, b) => a.oldStart - b.oldStart);
}

interface TokenStream { keys: string[]; texts: string[] }

function gap(old: TokenStream, next: TokenStream, oldStart: number, oldEnd: number, newStart: number, newEnd: number,
  oldTarget: TextFragment[], newTarget: TextFragment[]): boolean {
  const result = diffSequence(old.keys.slice(oldStart, oldEnd), next.keys.slice(newStart, newEnd), (a, b) => a === b, 80_000);
  if (result.limited) return false;
  let oi = oldStart, ni = newStart;
  for (let index = 0; index < result.edits.length;) {
    const edit = result.edits[index];
    if (edit === "equal") {
      const start = index;
      while (result.edits[index] === "equal") index++;
      const surroundedByEdits = start > 0 && index < result.edits.length;
      const common = old.texts.slice(oi, oi + index - start);
      for (let position = 0; position < common.length;) {
        const isWord = /[\p{L}\p{N}\p{M}_]/u.test(common[position]);
        let end = position + 1;
        while (end < common.length && /[\p{L}\p{N}\p{M}_]/u.test(common[end]) === isWord) end++;
        const changed = surroundedByEdits && isWord && end - position < 3;
        for (; position < end; position++) {
          append(oldTarget, old.texts[oi++], changed ? DiffChangeType.Deleted : DiffChangeType.Unchanged);
          append(newTarget, next.texts[ni++], changed ? DiffChangeType.Inserted : DiffChangeType.Unchanged);
        }
      }
    } else if (edit === "delete") { append(oldTarget, old.texts[oi++], DiffChangeType.Deleted); index++; }
    else { append(newTarget, next.texts[ni++], DiffChangeType.Inserted); index++; }
  }
  return true;
}

function project(fragments: TextFragment[], source: string[]): TextFragment[][] {
  const lines = source.map(() => [] as TextFragment[]);
  let line = 0;
  for (const fragment of fragments) {
    for (const part of fragment.text.split(/\n/u).entries()) {
      const [index, text] = part;
      if (index) line++;
      if (line < lines.length) append(lines[line], text, fragment.kind);
    }
  }
  return lines;
}

function restoreSkipped(fragments: TextFragment[], source: string, tokens: Token[]): TextFragment[] | null {
  const restored: TextFragment[] = [];
  let cursor = 0, tokenIndex = 0;
  for (const fragment of fragments) {
    for (const token of tokenize(fragment.text, PrecisionLevel.Character)) {
      const sourceToken = tokens[tokenIndex];
      if (sourceToken?.text !== token.text) return null;
      tokenIndex++;
      append(restored, source.slice(cursor, sourceToken.start), DiffChangeType.Unchanged);
      append(restored, sourceToken.text, fragment.kind);
      cursor = sourceToken.end;
    }
  }
  if (tokenIndex !== tokens.length) return null;
  append(restored, source.slice(cursor), DiffChangeType.Unchanged);
  return restored;
}

function characterTokens(text: string, lines: string[], normalizer: ComparisonNormalizer): { tokens: Token[]; filtered: boolean } {
  const masks: Array<readonly [number, number]> = [];
  let offset = 0;
  for (const line of lines) {
    for (const [start, end] of normalizer.maskRanges(line)) masks.push([offset + start, offset + end]);
    offset += line.length + 1;
  }
  let maskIndex = 0;
  const all = tokenize(text, PrecisionLevel.Character);
  const tokens = all.filter((token) => {
    if (normalizer.ignoresWhitespace && token.category === "space") return false;
    while (maskIndex < masks.length && masks[maskIndex][1] <= token.start) maskIndex++;
    return !(maskIndex < masks.length && token.start >= masks[maskIndex][0]);
  });
  return { tokens, filtered: tokens.length !== all.length || normalizer.ignoresWhitespace };
}

export function crossLineCharacterDiff(oldLines: string[], newLines: string[], normalizer: ComparisonNormalizer): { old: TextFragment[][]; next: TextFragment[][] } | null {
  const oldText = oldLines.join("\n"), newText = newLines.join("\n");
  const { tokens: oldTokens, filtered: oldFiltered } = characterTokens(oldText, oldLines, normalizer);
  const { tokens: newTokens, filtered: newFiltered } = characterTokens(newText, newLines, normalizer);
  if (oldTokens.length + newTokens.length > 2_000) return null;
  const old: TokenStream = { texts: oldTokens.map((token) => token.text), keys: oldTokens.map((token) => normalizer.tokenKey(token.text)) };
  const next: TokenStream = { texts: newTokens.map((token) => token.text), keys: newTokens.map((token) => normalizer.tokenKey(token.text)) };
  const matches = stableMatches(old.keys, next.keys);
  if (!matches) return null;
  const oldFragments: TextFragment[] = [], newFragments: TextFragment[] = [];
  let oi = 0, ni = 0;
  for (const match of matches) {
    if (!gap(old, next, oi, match.oldStart, ni, match.newStart, oldFragments, newFragments)) return null;
    for (let index = 0; index < match.length; index++) {
      append(oldFragments, old.texts[match.oldStart + index], DiffChangeType.Unchanged);
      append(newFragments, next.texts[match.newStart + index], DiffChangeType.Unchanged);
    }
    oi = match.oldStart + match.length;
    ni = match.newStart + match.length;
  }
  if (!gap(old, next, oi, old.keys.length, ni, next.keys.length, oldFragments, newFragments)) return null;
  const restoredOld = oldFiltered ? restoreSkipped(oldFragments, oldText, oldTokens) : oldFragments;
  const restoredNew = newFiltered ? restoreSkipped(newFragments, newText, newTokens) : newFragments;
  if (!restoredOld || !restoredNew) return null;
  return { old: project(restoredOld, oldLines), next: project(restoredNew, newLines) };
}
