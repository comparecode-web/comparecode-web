import { DiffChangeType, TextFragment } from "@/features/compare/text/types/diff";
import { Token, tokenize } from "./tokenize";
import { PrecisionLevel } from "@/types/settings";
import { diffSequence } from "./sequenceDiff";

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

function gap(old: string[], next: string[], oldTarget: TextFragment[], newTarget: TextFragment[]): boolean {
  const result = diffSequence(old, next, (a, b) => a === b, 80_000);
  if (result.limited) return false;
  let oi = 0, ni = 0;
  for (let index = 0; index < result.edits.length;) {
    const edit = result.edits[index];
    if (edit === "equal") {
      const start = index;
      while (result.edits[index] === "equal") index++;
      const surroundedByEdits = start > 0 && index < result.edits.length;
      const common = old.slice(oi, oi + index - start);
      for (let position = 0; position < common.length;) {
        const isWord = /[\p{L}\p{N}\p{M}_]/u.test(common[position]);
        let end = position + 1;
        while (end < common.length && /[\p{L}\p{N}\p{M}_]/u.test(common[end]) === isWord) end++;
        const changed = surroundedByEdits && isWord && end - position < 3;
        for (; position < end; position++) {
          append(oldTarget, old[oi++], changed ? DiffChangeType.Deleted : DiffChangeType.Unchanged);
          append(newTarget, next[ni++], changed ? DiffChangeType.Inserted : DiffChangeType.Unchanged);
        }
      }
    } else if (edit === "delete") { append(oldTarget, old[oi++], DiffChangeType.Deleted); index++; }
    else { append(newTarget, next[ni++], DiffChangeType.Inserted); index++; }
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

function restoreWhitespace(fragments: TextFragment[], source: string, tokens: Token[]): TextFragment[] | null {
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

export function crossLineCharacterDiff(oldLines: string[], newLines: string[], ignoreWhitespace = false): { old: TextFragment[][]; next: TextFragment[][] } | null {
  const oldText = oldLines.join("\n"), newText = newLines.join("\n");
  const oldTokens = tokenize(oldText, PrecisionLevel.Character).filter((token) => !ignoreWhitespace || token.category !== "space");
  const newTokens = tokenize(newText, PrecisionLevel.Character).filter((token) => !ignoreWhitespace || token.category !== "space");
  const old = oldTokens.map((token) => token.text);
  const next = newTokens.map((token) => token.text);
  if (old.length + next.length > 2_000) return null;
  const matches = stableMatches(old, next);
  if (!matches) return null;
  const oldFragments: TextFragment[] = [], newFragments: TextFragment[] = [];
  let oi = 0, ni = 0;
  for (const match of matches) {
    if (!gap(old.slice(oi, match.oldStart), next.slice(ni, match.newStart), oldFragments, newFragments)) return null;
    for (let index = 0; index < match.length; index++) {
      append(oldFragments, old[match.oldStart + index], DiffChangeType.Unchanged);
      append(newFragments, next[match.newStart + index], DiffChangeType.Unchanged);
    }
    oi = match.oldStart + match.length;
    ni = match.newStart + match.length;
  }
  if (!gap(old.slice(oi), next.slice(ni), oldFragments, newFragments)) return null;
  const restoredOld = ignoreWhitespace ? restoreWhitespace(oldFragments, oldText, oldTokens) : oldFragments;
  const restoredNew = ignoreWhitespace ? restoreWhitespace(newFragments, newText, newTokens) : newFragments;
  if (!restoredOld || !restoredNew) return null;
  return { old: project(restoredOld, oldLines), next: project(restoredNew, newLines) };
}
