export const MAX_HISTORY_OVERSHOOT = 6;
export const HISTORY_EASING = "cubic-bezier(.2,.7,.2,1)";

export function historySpringEasing(distance: number): string {
  // Peak overshoot of the original cubic Bezier with y2 = 1 and y1 = control.
  const overshoot = (control: number) => 4 * (control - 1) ** 3 / (3 * control - 2) ** 2;
  if (distance * overshoot(1.4) <= MAX_HISTORY_OVERSHOOT) return "cubic-bezier(.2,1.4,.35,1)";
  let low = 1;
  let high = 1.4;
  for (let iteration = 0; iteration < 30; iteration++) {
    const middle = (low + high) / 2;
    if (distance * overshoot(middle) <= MAX_HISTORY_OVERSHOOT) low = middle;
    else high = middle;
  }
  return `cubic-bezier(.2,${low},.35,1)`;
}
