export type Edit = "equal" | "delete" | "insert";

export interface SequenceDiff {
  edits: Edit[];
  limited: boolean;
  work: number;
}

/** Bounded Myers shortest edit script. A coarse replacement is returned on budget exhaustion. */
export function diffSequence<T>(oldItems: T[], newItems: T[], equals: (a: T, b: T) => boolean, budget = 200_000): SequenceDiff {
  let prefix = 0;
  while (prefix < oldItems.length && prefix < newItems.length && equals(oldItems[prefix], newItems[prefix])) prefix++;
  let suffix = 0;
  while (suffix < oldItems.length - prefix && suffix < newItems.length - prefix &&
    equals(oldItems[oldItems.length - suffix - 1], newItems[newItems.length - suffix - 1])) suffix++;

  const n = oldItems.length - prefix - suffix;
  const m = newItems.length - prefix - suffix;
  const edge: Edit[] = [
    ...Array<Edit>(prefix).fill("equal"),
    ...Array<Edit>(n).fill("delete"),
    ...Array<Edit>(m).fill("insert"),
    ...Array<Edit>(suffix).fill("equal")
  ];
  if (!n || !m) return { edits: edge, limited: false, work: 0 };

  let frontier = new Map<number, number>([[1, 0]]);
  const trace: Array<Map<number, number>> = [];
  let work = 0;
  for (let d = 0; d <= n + m; d++) {
    if (work + 2 * d + 1 > budget) return { edits: edge, limited: true, work };
    trace.push(new Map(frontier));
    const next = new Map<number, number>();
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && (frontier.get(k - 1) ?? -1) < (frontier.get(k + 1) ?? -1));
      let x = down ? (frontier.get(k + 1) ?? 0) : (frontier.get(k - 1) ?? 0) + 1;
      let y = x - k;
      while (x < n && y < m && equals(oldItems[prefix + x], newItems[prefix + y])) {
        x++;
        y++;
        work++;
        if (work > budget) return { edits: edge, limited: true, work };
      }
      next.set(k, x);
      work++;
      if (x >= n && y >= m) {
        const reversed: Edit[] = [];
        let bx = n, by = m;
        for (let step = d; step >= 0; step--) {
          const previous = trace[step];
          const diagonal = bx - by;
          const cameDown = diagonal === -step || (diagonal !== step &&
            (previous.get(diagonal - 1) ?? -1) < (previous.get(diagonal + 1) ?? -1));
          const previousDiagonal = cameDown ? diagonal + 1 : diagonal - 1;
          const previousX = step === 0 ? 0 : (previous.get(previousDiagonal) ?? 0);
          const previousY = previousX - previousDiagonal;
          while (bx > previousX && by > previousY) {
            reversed.push("equal"); bx--; by--;
          }
          if (step > 0) {
            reversed.push(cameDown ? "insert" : "delete");
            if (cameDown) by--; else bx--;
          }
        }
        return { edits: [...Array<Edit>(prefix).fill("equal"), ...reversed.reverse(), ...Array<Edit>(suffix).fill("equal")], limited: false, work };
      }
    }
    frontier = next;
  }
  return { edits: edge, limited: true, work };
}
