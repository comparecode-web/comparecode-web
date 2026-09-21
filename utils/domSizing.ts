export function remToCssPixels(value: number): number {
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return value * rootFontSize;
}
