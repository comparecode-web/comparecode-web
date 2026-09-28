import { diffSequence, Edit } from "./sequenceDiff";

interface Anchor { oldIndex: number; newIndex: number }

function uniqueAnchors(oldKeys: string[], newKeys: string[]): Anchor[] {
  const oldPositions = new Map<string, number>();
  const newPositions = new Map<string, number>();
  for (let index = 0; index < oldKeys.length; index++) {
    const key = oldKeys[index];
    oldPositions.set(key, oldPositions.has(key) ? -1 : index);
  }
  for (let index = 0; index < newKeys.length; index++) {
    const key = newKeys[index];
    newPositions.set(key, newPositions.has(key) ? -1 : index);
  }
  const candidates: Anchor[] = [];
  for (const [key, oldIndex] of oldPositions) {
    const newIndex = newPositions.get(key);
    if (key.trim().length >= 2 && oldIndex >= 0 && newIndex !== undefined && newIndex >= 0) {
      candidates.push({ oldIndex, newIndex });
    }
  }
  candidates.sort((a, b) => a.oldIndex - b.oldIndex);
  const previous = new Int32Array(candidates.length).fill(-1);
  const scores = new Int32Array(candidates.length);
  const lengths = new Int32Array(candidates.length);
  const tree = new Int32Array(newKeys.length + 1).fill(-1);
  const better = (left: number, right: number) => left >= 0 && (right < 0 ||
    scores[left] > scores[right] || (scores[left] === scores[right] && lengths[left] > lengths[right]));
  const bestBefore = (newIndex: number) => {
    let best = -1;
    for (let position = newIndex; position > 0; position -= position & -position) {
      if (better(tree[position], best)) best = tree[position];
    }
    return best;
  };
  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index];
    let predecessor = bestBefore(candidate.newIndex);
    const adjacent = index > 0 && candidates[index - 1].oldIndex === candidate.oldIndex - 1 &&
      candidates[index - 1].newIndex === candidate.newIndex - 1 ? index - 1 : -1;
    if (adjacent >= 0 && (predecessor < 0 || scores[adjacent] + 5 > scores[predecessor])) {
      predecessor = adjacent;
    }
    previous[index] = predecessor;
    scores[index] = 10 + (predecessor < 0 ? 0 : scores[predecessor]) + (predecessor === adjacent ? 5 : 0);
    lengths[index] = 1 + (predecessor < 0 ? 0 : lengths[predecessor]);
    for (let position = candidate.newIndex + 1; position < tree.length; position += position & -position) {
      if (better(index, tree[position])) tree[position] = index;
    }
  }
  const result: Anchor[] = [];
  let index = bestBefore(newKeys.length);
  while (index >= 0) { result.push(candidates[index]); index = previous[index]; }
  return result.reverse();
}

export function diffLines(oldKeys: string[], newKeys: string[], budget = 350_000): { edits: Edit[]; limited: boolean } {
  const anchors = uniqueAnchors(oldKeys, newKeys);
  if (!anchors.length) {
    const result = diffSequence(oldKeys, newKeys, (a, b) => a === b, budget);
    return { edits: result.edits, limited: result.limited };
  }
  const edits: Edit[] = [];
  let oldStart = 0, newStart = 0, remaining = budget, limited = false;
  for (const anchor of [...anchors, { oldIndex: oldKeys.length, newIndex: newKeys.length }]) {
    const result = diffSequence(oldKeys.slice(oldStart, anchor.oldIndex), newKeys.slice(newStart, anchor.newIndex),
      (a, b) => a === b, remaining);
    edits.push(...result.edits);
    remaining = Math.max(0, remaining - result.work);
    limited ||= result.limited;
    if (anchor.oldIndex < oldKeys.length) edits.push("equal");
    oldStart = anchor.oldIndex + 1;
    newStart = anchor.newIndex + 1;
  }
  return { edits, limited };
}
