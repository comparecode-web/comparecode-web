export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Oklab {
  l: number;
  a: number;
  b: number;
}

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_PATTERN = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

export function parseColor(value: string): Rgba {
  const input = value.trim();
  const hex = HEX_PATTERN.exec(input);
  if (hex) {
    const digits = hex[1].length <= 4 ? [...hex[1]].map((digit) => digit + digit).join("") : hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: digits.length === 8 ? parseInt(digits.slice(6, 8), 16) / 255 : 1
    };
  }
  const rgb = RGB_PATTERN.exec(input);
  if (rgb) {
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
  }
  throw new Error(`Unsupported color value: ${value}`);
}

function channelHex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, "0");
}

export function formatHex(color: Rgba): string {
  return `#${channelHex(color.r)}${channelHex(color.g)}${channelHex(color.b)}`;
}

export function formatColor(color: Rgba): string {
  if (color.a >= 1) {
    return formatHex(color);
  }
  const alpha = Math.round(color.a * 1000) / 1000;
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

export function withAlpha(value: string, alpha: number): string {
  return formatColor({ ...parseColor(value), a: alpha });
}

export function composite(foreground: string, background: string): string {
  const top = parseColor(foreground);
  const bottom = parseColor(background);
  if (bottom.a < 1) {
    throw new Error(`Background must be opaque: ${background}`);
  }
  return formatHex({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1
  });
}

function toLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function fromLinear(value: number): number {
  const encoded = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return encoded * 255;
}

function toOklab(color: Rgba): Oklab {
  const r = toLinear(color.r);
  const g = toLinear(color.g);
  const b = toLinear(color.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  };
}

function fromOklab(color: Oklab): Rgba {
  const l = (color.l + 0.3963377774 * color.a + 0.2158037573 * color.b) ** 3;
  const m = (color.l - 0.1055613458 * color.a - 0.0638541728 * color.b) ** 3;
  const s = (color.l - 0.0894841775 * color.a - 1.291485548 * color.b) ** 3;
  return {
    r: fromLinear(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: fromLinear(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: fromLinear(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    a: 1
  };
}

export function mix(from: string, to: string, amount: number): string {
  const start = toOklab(parseColor(from));
  const end = toOklab(parseColor(to));
  return formatHex(fromOklab({
    l: start.l + (end.l - start.l) * amount,
    a: start.a + (end.a - start.a) * amount,
    b: start.b + (end.b - start.b) * amount
  }));
}

export function relativeLuminance(value: string): number {
  const color = parseColor(value);
  return 0.2126 * toLinear(color.r) + 0.7152 * toLinear(color.g) + 0.0722 * toLinear(color.b);
}

export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function deltaE(first: string, second: string): number {
  const a = toOklab(parseColor(first));
  const b = toOklab(parseColor(second));
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b) * 100;
}

export function ensureContrast(foreground: string, backgrounds: string | ReadonlyArray<string>, minimum: number, target: string): string {
  const surfaces = typeof backgrounds === "string" ? [backgrounds] : backgrounds;
  const passes = (candidate: string) => surfaces.every((background) => contrastRatio(candidate, background) >= minimum);
  if (passes(foreground)) {
    return formatHex(parseColor(foreground));
  }
  for (let step = 1; step <= 40; step += 1) {
    const candidate = mix(foreground, target, step / 40);
    if (passes(candidate)) {
      return candidate;
    }
  }
  return formatHex(parseColor(target));
}
