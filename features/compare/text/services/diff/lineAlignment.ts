import { PrecisionLevel } from "@/types/settings";
import { tokenize } from "./tokenize";

export interface LinePair { oldIndex: number | null; newIndex: number | null }

export function alignLines(oldLines: string[], newLines: string[]): { pairs: LinePair[]; limited: boolean } {
  const n = oldLines.length, m = newLines.length;
  if (n * m > 10_000) {
    return { pairs: Array.from({ length: Math.max(n, m) }, (_, index) => ({
      oldIndex: index < n ? index : null, newIndex: index < m ? index : null
    })), limited: true };
  }
  const words = (text: string) => new Set(tokenize(text, PrecisionLevel.Word)
    .filter((token) => token.category === "word").map((token) => token.text));
  const oldWords = oldLines.map(words), newWords = newLines.map(words);
  const score = (i: number, j: number) => {
    const left = oldWords[i], right = newWords[j];
    let shared = 0;
    for (const word of left) if (right.has(word)) shared++;
    const wordScore = left.size && right.size ? 2 * shared / (left.size + right.size) : 0;
    const oldText = oldLines[i].trim(), newText = newLines[j].trim();
    let prefix = 0;
    while (prefix < Math.min(oldText.length, newText.length) && oldText[prefix] === newText[prefix]) prefix++;
    const prefixScore = prefix >= 4 ? prefix / Math.max(oldText.length, newText.length) : 0;
    return Math.max(wordScore, prefixScore);
  };
  const dp = Array.from({ length: n + 1 }, () => new Float32Array(m + 1));
  const choice = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
  for (let i = 1; i <= n; i++) { dp[i][0] = -i * 0.35; choice[i][0] = 1; }
  for (let j = 1; j <= m; j++) { dp[0][j] = -j * 0.35; choice[0][j] = 2; }
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const shared = score(i - 1, j - 1);
      const paired = shared >= 0.4 || (n === 1 && m === 1) ? dp[i - 1][j - 1] + shared : -Infinity;
      const removed = dp[i - 1][j] - 0.35;
      const inserted = dp[i][j - 1] - 0.35;
      if (paired >= removed && paired >= inserted) { dp[i][j] = paired; choice[i][j] = 3; }
      else if (removed >= inserted) { dp[i][j] = removed; choice[i][j] = 1; }
      else { dp[i][j] = inserted; choice[i][j] = 2; }
    }
  }
  const pairs: LinePair[] = [];
  let i = n, j = m;
  while (i || j) {
    if (choice[i][j] === 3) { pairs.push({ oldIndex: --i, newIndex: --j }); }
    else if (choice[i][j] === 1) pairs.push({ oldIndex: --i, newIndex: null });
    else pairs.push({ oldIndex: null, newIndex: --j });
  }
  const ordered = pairs.reverse();
  const compacted: LinePair[] = [];
  let removed: number[] = [], inserted: number[] = [];
  const flush = () => {
    for (let index = 0; index < Math.max(removed.length, inserted.length); index++) {
      compacted.push({ oldIndex: removed[index] ?? null, newIndex: inserted[index] ?? null });
    }
    removed = [];
    inserted = [];
  };
  for (const pair of ordered) {
    if (pair.oldIndex !== null && pair.newIndex !== null) {
      flush();
      compacted.push(pair);
    } else if (pair.oldIndex !== null) removed.push(pair.oldIndex);
    else if (pair.newIndex !== null) inserted.push(pair.newIndex);
  }
  flush();
  return { pairs: compacted, limited: false };
}
