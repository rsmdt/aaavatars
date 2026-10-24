export const SHAPES = [
  "circle",
  "squircle",
  "pill",
  "hex",
  "triangle",
  "drop",
  "cloud",
  "blob",
] as const;

export const EYES = ["round", "dot", "tall", "wide"] as const;

export const MOUTHS = ["none", "smile", "flat", "open"] as const;

export const ACCESSORIES = ["none", "antenna", "sprout", "hat", "glasses", "bowtie"] as const;

export const FILLS = ["solid", "gradient"] as const;

const BLINK_MIN_SECONDS = 5;
const BLINK_SPREAD_SECONDS = 4;
const TEMPO_MIN = 0.85;
const TEMPO_SPREAD = 0.3;

export const DEFAULT_COLORS = ["#264653", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"];

export type Shape = (typeof SHAPES)[number];
export type Eyes = (typeof EYES)[number];
export type Mouth = (typeof MOUTHS)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type Fill = (typeof FILLS)[number];

export interface AvatarSpec {
  accent: string;
  accessory: Accessory;
  background: string;
  blinkDelay: number;
  blinkDuration: number;
  body: string;
  eyeColor: string;
  eyes: Eyes;
  mouth: Mouth;
  offsetX: number;
  offsetY: number;
  phase: number;
  rotate: number;
  shape: Shape;
  tempo: number;
}

export interface SpecOptions {
  accessory?: Accessory;
  background?: string;
  body?: string;
  colors?: readonly string[];
  eyes?: Eyes;
  mouth?: Mouth;
  shape?: Shape;
}

export function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return result >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let next = Math.imul(state ^ (state >>> 15), 1 | state);
    next = (next + Math.imul(next ^ (next >>> 7), 61 | next)) ^ next;
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] as T;
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundHundredth(value: number): number {
  return Math.round(value * 100) / 100;
}

function signedRange(random: () => number, limit: number): number {
  return Math.round((random() * 2 - 1) * limit);
}

function relativeLuminance(hex: string): number {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const [red, green, blue] = [0, 2, 4].map((start) => {
    const channel = Number.parseInt(full.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

export function createSpec(name: string, options: SpecOptions = {}): AvatarSpec {
  const colors = options.colors?.length ? options.colors : DEFAULT_COLORS;
  const random = seededRandom(hash(name));
  const backgroundIndex = Math.floor(random() * colors.length);
  const bodyShift = 1 + Math.floor(random() * Math.max(colors.length - 1, 1));
  const bodyIndex = (backgroundIndex + bodyShift) % colors.length;
  const shape = pick(SHAPES, random);
  const eyes = pick(EYES, random);
  const offsetX = signedRange(random, 6);
  const offsetY = signedRange(random, 5);
  const rotate = signedRange(random, 12);
  const accentCandidates = colors.filter(
    (_, index) => index !== bodyIndex && index !== backgroundIndex,
  );
  const accent = accentCandidates.length ? pick(accentCandidates, random) : (colors[0] as string);
  const blinkDuration = roundTenth(BLINK_MIN_SECONDS + random() * BLINK_SPREAD_SECONDS);
  const blinkDelay = -roundTenth(random() * blinkDuration);
  const tempo = roundHundredth(TEMPO_MIN + random() * TEMPO_SPREAD);
  const phase = roundHundredth(random() * 0.99);
  const background = options.background ?? (colors[backgroundIndex] as string);
  const body = options.body ?? (colors[bodyIndex] as string);
  return {
    accent,
    accessory: options.accessory ?? "none",
    background,
    blinkDelay,
    blinkDuration,
    body,
    eyeColor: relativeLuminance(body) > 0.4 ? "#141414" : "#FFFFFF",
    eyes: options.eyes ?? eyes,
    mouth: options.mouth ?? "none",
    offsetX,
    offsetY,
    phase,
    rotate,
    shape: options.shape ?? shape,
    tempo,
  };
}

export function shadeHex(hex: string, amount: number): string {
  const digits = hex.replace("#", "");
  const full = digits.length === 3 ? [...digits].map((digit) => digit + digit).join("") : digits;
  const target = amount < 0 ? 0 : 255;
  const weight = Math.abs(amount);
  const channels = [0, 2, 4].map((start) => {
    const channel = Number.parseInt(full.slice(start, start + 2), 16);
    return Math.round(channel + (target - channel) * weight)
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}
