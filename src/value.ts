import {
  ACCESSORIES,
  type Accessory,
  EYES,
  type Eyes,
  FILLS,
  type Fill,
  MOUTHS,
  type Mouth,
  SHAPES,
  type Shape,
} from "./spec.js";

export interface AvatarValue {
  accessory?: Accessory;
  background?: string;
  body?: string;
  eyes?: Eyes;
  fill?: Fill;
  mouth?: Mouth;
  shape?: Shape;
}

export type ParsedAvatarValue = { ok: true; value: AvatarValue } | { ok: false; error: string };

export const AVATAR_VALUE_MAX_LENGTH = 200;

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const ENUM_FIELDS = {
  shape: SHAPES,
  eyes: EYES,
  mouth: MOUTHS,
  accessory: ACCESSORIES,
  fill: FILLS,
} as const;

const COLOR_FIELDS = ["body", "background"] as const;

const FIELD_ORDER = [
  "shape",
  "eyes",
  "mouth",
  "accessory",
  "body",
  "background",
  "fill",
] as const satisfies readonly (keyof AvatarValue)[];

type EnumField = keyof typeof ENUM_FIELDS;
type ColorField = (typeof COLOR_FIELDS)[number];

function isEnumField(key: string): key is EnumField {
  return key in ENUM_FIELDS;
}

function isColorField(key: string): key is ColorField {
  return (COLOR_FIELDS as readonly string[]).includes(key);
}

export function parseAvatarValue(raw: string): ParsedAvatarValue {
  if (raw.length > AVATAR_VALUE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Avatar value is longer than ${AVATAR_VALUE_MAX_LENGTH} characters.`,
    };
  }
  const value: Record<string, string> = {};
  for (const entry of raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)) {
    const separator = entry.indexOf("=");
    const key = separator === -1 ? entry : entry.slice(0, separator).trim();
    const field = separator === -1 ? "" : entry.slice(separator + 1).trim();
    if (key in value) return { ok: false, error: `"${key}" is set more than once.` };
    if (isEnumField(key)) {
      const allowed: readonly string[] = ENUM_FIELDS[key];
      if (!allowed.includes(field)) {
        return { ok: false, error: `"${key}" must be one of ${allowed.join(", ")}.` };
      }
    } else if (isColorField(key)) {
      if (!HEX_COLOR.test(field)) {
        return { ok: false, error: `"${key}" must be a hex color like #E76F51.` };
      }
    } else {
      return { ok: false, error: `Unknown avatar field "${key}". Use ${FIELD_ORDER.join(", ")}.` };
    }
    value[key] = field;
  }
  return { ok: true, value: value as AvatarValue };
}

export function formatAvatarValue(value: AvatarValue): string {
  return FIELD_ORDER.filter((key) => value[key] !== undefined)
    .map((key) => `${key}=${value[key]}`)
    .join(";");
}
