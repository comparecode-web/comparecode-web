import * as Diff from "diff";
import { DiffChangeType, TextFragment, ChangeLine } from "@/features/compare/text/types/diff";
import { tokenizeByWhitespace, hasWordLikeContent, isMeaningfulShortCrossLineAnchor } from "./coreUtils";

export function appendMergedFragment(target: Array<TextFragment>, text: string, kind: DiffChangeType) {
  if (text.length === 0) {
    return;
  }
  const isWhitespaceChange = text.trim() === "";
  const last = target.length > 0 ? target[target.length - 1] : null;
  if (last && last.kind === kind && last.isWhitespaceChange === isWhitespaceChange) {
    last.text += text;
    return;
  }
  target.push({
    text,
    kind,
    isWhitespaceChange
  });
}

export function normalizeCharacterChanges(changes: Array<Diff.Change>, minInternalUnchangedLength: number): Array<Diff.Change> {
  if (changes.length === 0 || minInternalUnchangedLength <= 1) {
    return changes;
  }
  const normalized: Array<Diff.Change> = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const isUnchanged = !change.added && !change.removed;
    if (!isUnchanged) {
      normalized.push(change);
      continue;
    }
    const isWhitespace = change.value.trim() === "";
    const isShort = change.value.length < minInternalUnchangedLength;
    const prev = i > 0 ? changes[i - 1] : null;
    const next = i + 1 < changes.length ? changes[i + 1] : null;
    const isInternal = prev !== null && next !== null;
    const prevIsChanged = prev !== null && (prev.added || prev.removed);
    const nextIsChanged = next !== null && (next.added || next.removed);
    if (!isWhitespace && isShort && isInternal && prevIsChanged && nextIsChanged) {
      normalized.push({ value: change.value, added: false, removed: true, count: change.value.length });
      normalized.push({ value: change.value, added: true, removed: false, count: change.value.length });
    } else {
      normalized.push(change);
    }
  }
  return normalized;
}

export function normalizeCrossLineCharacterChanges(changes: Array<Diff.Change>, minInternalUnchangedLength: number): Array<Diff.Change> {
  if (changes.length === 0 || minInternalUnchangedLength <= 1) {
    return changes;
  }
  const normalized: Array<Diff.Change> = [];
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    const isUnchanged = !change.added && !change.removed;
    if (!isUnchanged) {
      normalized.push(change);
      continue;
    }
    const isWhitespace = change.value.trim() === "";
    const isShort = change.value.length < minInternalUnchangedLength;
    const prev = i > 0 ? changes[i - 1] : null;
    const next = i + 1 < changes.length ? changes[i + 1] : null;
    const isInternal = prev !== null && next !== null;
    const prevIsChanged = prev !== null && (prev.added || prev.removed);
    const nextIsChanged = next !== null && (next.added || next.removed);
    if (!isWhitespace && isShort && isInternal && prevIsChanged && nextIsChanged && !isMeaningfulShortCrossLineAnchor(change.value)) {
      normalized.push({ value: change.value, added: false, removed: true, count: change.value.length });
      normalized.push({ value: change.value, added: true, removed: false, count: change.value.length });
    } else {
      normalized.push(change);
    }
  }
  return normalized;
}

export function projectFragmentsToLines(flatFragments: Array<TextFragment>, expectedLineCount: number, startLineNum: number, lineKind: DiffChangeType): Array<ChangeLine> {
  const lineBuckets: Array<Array<TextFragment>> = [[]];
  const appendFragment = (bucket: Array<TextFragment>, fragment: TextFragment, text: string) => {
    if (text.length === 0) {
      return;
    }
    bucket.push({
      text,
      kind: fragment.kind,
      isWhitespaceChange: text.trim() === ""
    });
  };
  for (let i = 0; i < flatFragments.length; i++) {
    const fragment = flatFragments[i];
    let cursor = 0;
    while (cursor < fragment.text.length) {
      const newlineIndex = fragment.text.indexOf("\n", cursor);
      if (newlineIndex === -1) {
        appendFragment(lineBuckets[lineBuckets.length - 1], fragment, fragment.text.slice(cursor));
        break;
      }
      appendFragment(lineBuckets[lineBuckets.length - 1], fragment, fragment.text.slice(cursor, newlineIndex));
      lineBuckets.push([]);
      cursor = newlineIndex + 1;
    }
  }
  if (expectedLineCount > 0 && lineBuckets.length > expectedLineCount) {
    const overflowStart = expectedLineCount;
    for (let i = overflowStart; i < lineBuckets.length; i++) {
      lineBuckets[expectedLineCount - 1] = lineBuckets[expectedLineCount - 1].concat(lineBuckets[i]);
    }
    lineBuckets.length = expectedLineCount;
  }
  while (lineBuckets.length < expectedLineCount) {
    lineBuckets.push([]);
  }
  const result: Array<ChangeLine> = [];
  for (let i = 0; i < expectedLineCount; i++) {
    result.push({
      lineNumber: startLineNum + i,
      kind: lineKind,
      isInModifiedBlock: true,
      fragments: lineBuckets[i]
    });
  }
  return result;
}

export function generateWordPrecisionChanges(oldStr: string, newStr: string): Array<Diff.Change> {
  const oldTokens = tokenizeByWhitespace(oldStr);
  const newTokens = tokenizeByWhitespace(newStr);
  const tokenChanges = Diff.diffArrays(oldTokens, newTokens);
  const normalizedChanges: Array<Diff.Change> = [];
  for (let i = 0; i < tokenChanges.length; i++) {
    const tokenChange = tokenChanges[i];
    const value = tokenChange.value.join("");
    if (value.length === 0) {
      continue;
    }
    if (tokenChange.added) {
      normalizedChanges.push({ value, added: true, removed: false, count: value.length });
    } else if (tokenChange.removed) {
      normalizedChanges.push({ value, added: false, removed: true, count: value.length });
    } else {
      normalizedChanges.push({ value, added: false, removed: false, count: value.length });
    }
  }
  return normalizedChanges;
}

export function mergeAdjacentFragments(fragments: Array<TextFragment>): Array<TextFragment> {
  if (fragments.length < 2) {
    return fragments;
  }
  const merged: Array<TextFragment> = [];
  for (let i = 0; i < fragments.length; i++) {
    const current = fragments[i];
    const last = merged.length > 0 ? merged[merged.length - 1] : null;
    if (last && last.kind === current.kind && last.isWhitespaceChange === current.isWhitespaceChange) {
      last.text += current.text;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

export function mergeWhitespaceBetweenChangedFragments(fragments: Array<TextFragment>, changedKind: DiffChangeType): Array<TextFragment> {
  if (fragments.length < 3) {
    return fragments;
  }
  const normalized = fragments.map((fragment) => ({ ...fragment }));
  for (let i = 1; i < normalized.length - 1; i++) {
    const previous = normalized[i - 1];
    const current = normalized[i];
    const next = normalized[i + 1];
    if (current.kind !== DiffChangeType.Unchanged) {
      continue;
    }
    if (current.text.trim() !== "") {
      continue;
    }
    if (previous.kind === changedKind && next.kind === changedKind && hasWordLikeContent(previous.text) && hasWordLikeContent(next.text)) {
      current.kind = changedKind;
      current.isWhitespaceChange = true;
    }
  }
  return mergeAdjacentFragments(normalized);
}

export function normalizeTrailingWhitespaceAtChangeBoundary(fragments: Array<TextFragment>): Array<TextFragment> {
  if (fragments.length < 2) {
    return fragments;
  }
  const normalized = fragments.map((fragment) => ({ ...fragment }));
  for (let i = 0; i < normalized.length - 1; i++) {
    const current = normalized[i];
    const next = normalized[i + 1];
    const currentIsChanged = current.kind === DiffChangeType.Inserted || current.kind === DiffChangeType.Deleted;
    if (!currentIsChanged || next.kind !== DiffChangeType.Unchanged) {
      continue;
    }
    if (next.text.length === 0 || /^\s/.test(next.text)) {
      continue;
    }
    const trailingWhitespaceMatch = current.text.match(/\s+$/);
    if (!trailingWhitespaceMatch) {
      continue;
    }
    const trailingWhitespace = trailingWhitespaceMatch[0];
    current.text = current.text.slice(0, current.text.length - trailingWhitespace.length);
    next.text = trailingWhitespace + next.text;
    current.isWhitespaceChange = current.text.trim() === "";
    next.isWhitespaceChange = next.text.trim() === "";
    if (current.text.length === 0) {
      normalized.splice(i, 1);
      i--;
    }
  }
  return mergeAdjacentFragments(normalized);
}

export function rebalanceDuplicateBoundaryHighlights(fragments: Array<TextFragment>): Array<TextFragment> {
  if (fragments.length < 2) {
    return fragments;
  }
  const normalized = fragments.map((fragment) => ({ ...fragment }));
  for (let i = 0; i < normalized.length - 1; i++) {
    const current = normalized[i];
    const next = normalized[i + 1];
    const isCurrentChanged = current.kind === DiffChangeType.Inserted || current.kind === DiffChangeType.Deleted;
    const isNextUnchanged = next.kind === DiffChangeType.Unchanged;
    if (!isCurrentChanged || !isNextUnchanged) {
      continue;
    }
    if (current.text.length < 2 || next.text.length === 0) {
      continue;
    }
    const firstChar = current.text[0];
    const nextChar = next.text[0];
    if (firstChar !== nextChar) {
      continue;
    }
    const previous = i > 0 ? normalized[i - 1] : null;
    if (previous && previous.kind === DiffChangeType.Unchanged) {
      previous.text += firstChar;
    } else {
      normalized.splice(i, 0, {
        text: firstChar,
        kind: DiffChangeType.Unchanged,
        isWhitespaceChange: firstChar.trim() === ""
      });
      i++;
    }
    current.text = current.text.slice(1) + nextChar;
    next.text = next.text.slice(1);
    current.isWhitespaceChange = current.text.trim() === "";
    next.isWhitespaceChange = next.text.trim() === "";
    if (next.text.length === 0) {
      normalized.splice(i + 1, 1);
      i--;
    }
  }
  return normalized;
}
