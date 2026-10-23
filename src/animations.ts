export const AVATAR_EVENTS = [
  "acknowledge",
  "handoff",
  "success",
  "warning",
  "error",
  "surprised",
  "sigh",
  "yawn",
] as const;

import type { EyePose, Glyph, Mood } from "./parts.js";
import type { Accessory } from "./spec.js";

export type AvatarEvent = (typeof AVATAR_EVENTS)[number];

type AccessoryFrames = Partial<Record<Exclude<Accessory, "none">, Keyframe[]>>;

export interface LidFrame {
  bottom?: number;
  easing?: string;
  offset: number;
  tilt?: number;
  top?: number;
}

export interface EyeSize {
  gap: number;
  h: number;
  w: number;
}

export interface EventAnimation {
  accessory?: AccessoryFrames;
  body: Keyframe[];
  duration: number;
  eye?: (side: -1 | 1, size: EyeSize) => Keyframe[];
  eyes: Keyframe[];
  glyph?: { frames?: Keyframe[]; shape: Glyph };
  lids?: LidFrame[];
  mood?: { frames?: Keyframe[]; name: Mood; rest?: Keyframe[] };
  mouth?: Keyframe[];
  pose?: EyePose;
  prep?: number;
}

export const EASE_OUT = "cubic-bezier(.22,1,.36,1)";
export const EASE_IN_OUT = "cubic-bezier(.65,0,.35,1)";
export const EASE_HEAD = "cubic-bezier(.16,1,.3,1)";
export const EASE_SINE = "cubic-bezier(.37,0,.63,1)";
const EASE_SINK = "cubic-bezier(.32,0,.24,1)";

export const PREP_MS = 500;
const SETTLE_MS = 180;

function hold(transform: string, from: number, to: number): Keyframe[] {
  return [
    { transform, offset: from },
    { transform, offset: to },
  ];
}

function stalk(frames: Keyframe[]): AccessoryFrames {
  return { antenna: frames, sprout: frames };
}

function sample(
  from: number,
  to: number,
  steps: number,
  frame: (t: number) => Keyframe,
): Keyframe[] {
  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    return { ...frame(t), offset: from + (to - from) * t, easing: "linear" };
  });
}

function withOffsets(frames: Keyframe[]): Keyframe[] {
  const offsets = frames.map((frame, index) =>
    frame.offset ?? (index === 0 ? 0 : index === frames.length - 1 ? 1 : null),
  );
  for (let index = 0; index < offsets.length; index += 1) {
    if (offsets[index] != null) continue;
    const start = index - 1;
    let end = index;
    while (offsets[end] == null) end += 1;
    const from = offsets[start] as number;
    const to = offsets[end] as number;
    for (let gap = index; gap < end; gap += 1) {
      offsets[gap] = from + ((to - from) * (gap - start)) / (end - start);
    }
  }
  return frames.map((frame, index) => ({ ...frame, offset: offsets[index] as number }));
}

export function stage(
  frames: Keyframe[],
  duration: number,
  prep: number,
  current: Keyframe = {},
): Keyframe[] {
  const timed = withOffsets(frames).map((frame) => ({ easing: EASE_OUT, ...frame }));
  if (!prep) return timed;
  const total = prep + duration;
  const shifted = timed.map((frame) => ({
    ...frame,
    offset: (prep + (frame.offset as number) * duration) / total,
  }));
  if (!timed.some((frame) => "transform" in frame)) {
    return [
      { ...current, offset: 0 },
      { ...current, offset: prep / total },
      ...shifted,
    ];
  }
  return [
    { ...current, offset: 0, easing: EASE_OUT },
    { ...current, offset: Math.min(SETTLE_MS, prep) / total, transform: "none", easing: "linear" },
    { ...current, offset: prep / total, transform: "none", easing: EASE_OUT },
    ...shifted,
  ];
}

export const MOOD_SWAP_REST: Keyframe[] = [
  { opacity: 0, offset: 0.12 },
  { opacity: 0, offset: 0.88 },
];

export const MOOD_SWAP_SHOW: Keyframe[] = [
  { opacity: 1, offset: 0.12 },
  { opacity: 1, offset: 0.88 },
];

function sweep(t: number): number {
  const points: [number, number][] = [
    [0, 0],
    [0.16, -1],
    [0.4, 1],
    [0.64, -0.88],
    [0.84, 0.58],
    [1, 0],
  ];
  const index = points.findIndex(([at]) => at >= t);
  if (index <= 0) return 0;
  const [fromAt, from] = points[index - 1] as [number, number];
  const [toAt, to] = points[index] as [number, number];
  const local = (t - fromAt) / (toAt - fromAt);
  return from + (to - from) * local * local * (3 - 2 * local);
}

const REST: Keyframe = { offset: 1 };

function nodDepth(ms: number): number {
  if (ms < 150) return ms / 150;
  if (ms < 300) return 1 - (ms - 150) / 150;
  if (ms < 450) return (ms - 300) / 150;
  return Math.max(0, 1 - (ms - 450) / 310);
}

export const EVENT_ANIMATIONS: Record<AvatarEvent, EventAnimation> = {
  acknowledge: {
    mouth: [{ transform: "scaleY(0.5)", offset: 0.35 }],
    accessory: {
      ...stalk([
        { transform: "rotate(-12deg)", offset: 0.3 },
        { transform: "rotate(8deg)", offset: 0.65 },
      ]),
      hat: [{ transform: "translateY(-4px)", offset: 0.35 }],
      glasses: [{ transform: "translateY(-2px)", offset: 0.35 }],
      bowtie: [{ transform: "scale(1.25)", offset: 0.35 }],
    },
    duration: 920,
    body: [
      { transform: "translateY(0)", offset: 0, easing: EASE_HEAD },
      { transform: "translateY(2px)", offset: 0.52, easing: EASE_HEAD },
      REST,
    ],
    eyes: [
      ...sample(0, 760 / 920, 16, (t) => {
        const depth = nodDepth(t * 760);
        return { transform: `translateY(${(depth * 6).toFixed(2)}px) scaleY(${(1 - 0.3 * depth).toFixed(3)})` };
      }),
      REST,
    ],
  },
  handoff: {
    body: [],
    duration: 1500,
    eyes: [],
    glyph: {
      shape: "slide",
      frames: [
        { transform: "translateX(0)", opacity: 1, offset: 0 },
        { transform: "translateX(0)", opacity: 1, offset: 0.3, easing: EASE_IN_OUT },
        { transform: "translateX(70px)", opacity: 0, offset: 0.5 },
        { transform: "translateX(-70px)", opacity: 0, offset: 0.5, easing: EASE_IN_OUT },
        { transform: "translateX(0)", opacity: 1, offset: 0.75 },
        { transform: "translateX(0)", opacity: 1, offset: 1 },
      ],
    },
  },
  success: { body: [], duration: 1400, eyes: [], glyph: { shape: "check" } },
  error: {
    mood: { name: "sad" },
    accessory: {
      ...stalk(hold("rotate(30deg)", 0.2, 0.85)),
      hat: hold("translateY(4px) rotate(10deg)", 0.2, 0.85),
      glasses: hold("translateY(3px) rotate(10deg)", 0.2, 0.85),
      bowtie: hold("rotate(20deg)", 0.2, 0.85),
    },
    duration: 2280,
    body: [
      { transform: "translateY(0)", offset: 0.14, easing: EASE_SINK },
      { transform: "translateY(2.75px)", offset: 0.456 },
      { transform: "translateY(2.75px)", offset: 0.772, easing: EASE_SINK },
      REST,
    ],
    eyes: [
      { transform: "translateY(0)", offset: 0.14, easing: EASE_SINE },
      { transform: "translateY(2px)", offset: 0.456 },
      { transform: "translateY(2px)", offset: 0.772, easing: EASE_SINE },
      REST,
    ],
    pose: "cross",
  },
  surprised: {
    mood: {
      name: "o",
      frames: [
        { opacity: 1, transform: "scale(1.3)", offset: 0.19 },
        { opacity: 1, transform: "scale(1.3)", offset: 0.66 },
        { opacity: 0, offset: 0.9 },
      ],
      rest: [
        { opacity: 0, offset: 0.19 },
        { opacity: 0, offset: 0.8 },
      ],
    },
    accessory: {
      antenna: hold("scaleY(1.4)", 0.2, 0.7),
      sprout: hold("scale(1.3)", 0.2, 0.7),
      hat: hold("translateY(-5px)", 0.2, 0.6),
      glasses: hold("translateY(-5px)", 0.2, 0.7),
      bowtie: hold("scale(1.3)", 0.2, 0.7),
    },
    duration: 1260,
    body: [
      { transform: "scale(1)", offset: 0.187, easing: EASE_OUT },
      { transform: "scale(1.035)", offset: 0.325 },
      { transform: "scale(1.035)", offset: 0.658, easing: EASE_OUT },
      REST,
    ],
    eyes: [
      { transform: "scale(1)", offset: 0, easing: EASE_IN_OUT },
      { transform: "scale(0.63)", offset: 0.187, easing: EASE_OUT },
      ...sample(0.325, 0.658, 12, (t) => ({
        transform: `scale(${(1.26 * (1 + 0.022 * Math.sin(t * Math.PI * 8) * (1 - 0.18 * t))).toFixed(4)})`,
      })),
      { ...REST, easing: EASE_OUT },
    ],
  },
  warning: {
    duration: 3327,
    body: [
      { transform: "translateY(0)", offset: 0.301, easing: EASE_SINE },
      { transform: "translateY(2.5px)", offset: 0.361 },
      { transform: "translateY(2.5px)", offset: 0.451, easing: EASE_SINE },
      { transform: "translateY(-2px)", offset: 0.511 },
      { transform: "translateY(-2px)", offset: 0.661, easing: EASE_SINE },
      { transform: "translateY(0)", offset: 0.691 },
      REST,
    ],
    eyes: [],
    eye: (side, { gap }) => {
      const near = side === -1;
      const lean = near
        ? `translate(${((16 / 34) * gap).toFixed(2)}px,0px) rotate(-6.5deg) scale(1.37,1.4)`
        : `translate(${((20.5 / 34) * gap).toFixed(2)}px,${((7.5 / 34) * gap).toFixed(2)}px) rotate(7.5deg) scale(.68,.99)`;
      const sunk = near
        ? lean
        : `translate(${((20.5 / 34) * gap).toFixed(2)}px,${((9.9 / 34) * gap).toFixed(2)}px) rotate(7.5deg) scale(.68,.99)`;
      return [
        { transform: "none", offset: 0, easing: EASE_SINE },
        { transform: lean, offset: 0.12 },
        { transform: lean, offset: 0.301, easing: EASE_SINE },
        { transform: sunk, offset: 0.361 },
        { transform: sunk, offset: 0.451, easing: EASE_SINE },
        { transform: lean, offset: 0.511 },
        { transform: lean, offset: 0.932, easing: EASE_SINE },
        REST,
      ];
    },
    lids: [
      { offset: 0, top: 0, bottom: 0, easing: EASE_SINE },
      { offset: 0.12, top: 0.69, bottom: 0, tilt: -21, easing: EASE_SINE },
      { offset: 0.156, top: 0.835, bottom: 0, tilt: -21 },
      { offset: 0.301, top: 0.835, bottom: 0, tilt: -21, easing: EASE_SINE },
      { offset: 0.361, top: 1.46, bottom: 0, tilt: -21 },
      { offset: 0.451, top: 1.46, bottom: 0, tilt: -21, easing: EASE_SINE },
      { offset: 0.511, top: 0.466, bottom: 0, tilt: -21 },
      { offset: 0.661, top: 0.466, bottom: 0, tilt: -21, easing: EASE_SINE },
      { offset: 0.691, top: 0.835, bottom: 0, tilt: -21 },
      { offset: 0.932, top: 0.835, bottom: 0, tilt: -21, easing: EASE_SINE },
      { offset: 1 },
    ],
  },
  sigh: {
    mood: {
      name: "o",
      frames: [
        { opacity: 0, transform: "scale(.5)", offset: 0.3 },
        { opacity: 1, transform: "scale(.7)", offset: 0.42 },
        { opacity: 1, transform: "scale(.45)", offset: 0.7 },
        { opacity: 0, offset: 0.82 },
      ],
      rest: [
        { opacity: 0, offset: 0.3 },
        { opacity: 0, offset: 0.82 },
      ],
    },
    accessory: {
      ...stalk(hold("rotate(18deg)", 0.4, 0.75)),
      hat: hold("translateY(3px)", 0.4, 0.75),
      glasses: hold("translateY(2px)", 0.4, 0.75),
      bowtie: hold("rotate(10deg)", 0.4, 0.75),
    },
    duration: 2100,
    body: [
      { transform: "translateY(0) scale(1)", offset: 0, easing: EASE_SINE },
      { transform: "translateY(-1.5px) scale(1.02,1.03)", offset: 0.3, easing: EASE_SINK },
      { transform: "translateY(3px) scale(1.03,.95)", offset: 0.55 },
      { transform: "translateY(3px) scale(1.03,.95)", offset: 0.75, easing: EASE_SINE },
      REST,
    ],
    eyes: [
      { transform: "translateY(0)", offset: 0.3, easing: EASE_SINK },
      { transform: "translateY(2px)", offset: 0.55 },
      { transform: "translateY(2px)", offset: 0.75, easing: EASE_SINE },
      REST,
    ],
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 0.3, top: 0.2, bottom: 0, easing: EASE_SINK },
      { offset: 0.5, top: 0.65, bottom: 0 },
      { offset: 0.78, top: 0.65, bottom: 0, easing: EASE_OUT },
      { offset: 1 },
    ],
  },
  yawn: {
    mood: {
      name: "o",
      frames: [
        { opacity: 1, transform: "scale(.6,.5)", offset: 0.1 },
        { opacity: 1, transform: "scale(1.15,1.6)", offset: 0.4 },
        { opacity: 1, transform: "scale(1.15,1.6)", offset: 0.58 },
        { opacity: 0, transform: "scale(.6,.5)", offset: 0.75 },
      ],
      rest: [
        { opacity: 0, offset: 0.1 },
        { opacity: 0, offset: 0.75 },
      ],
    },
    accessory: {
      ...stalk(hold("rotate(-10deg)", 0.2, 0.65)),
      hat: hold("translateY(-3px)", 0.2, 0.65),
      glasses: hold("translateY(-3px)", 0.2, 0.65),
      bowtie: hold("scale(1.15)", 0.2, 0.65),
    },
    duration: 2700,
    body: [
      { transform: "scale(1)", offset: 0, easing: EASE_SINE },
      { transform: "translateY(-2px) scale(.95,1.07)", offset: 0.4 },
      { transform: "translateY(-2px) scale(.95,1.07)", offset: 0.58, easing: EASE_SINE },
      { transform: "translateY(0) scale(1.02,.98)", offset: 0.74, easing: EASE_OUT },
      REST,
    ],
    eyes: [],
    lids: [
      { offset: 0, top: 0, bottom: 0, easing: EASE_SINE },
      { offset: 0.38, top: 0.95, bottom: 0.9 },
      { offset: 0.6, top: 0.95, bottom: 0.9, easing: EASE_IN_OUT },
      { offset: 0.72, top: 0.45, bottom: 0 },
      { offset: 0.8, top: 1, bottom: 1, easing: EASE_OUT },
      { offset: 0.88, top: 0, bottom: 0 },
      { offset: 1 },
    ],
  },
};

export const WAKE_ANIMATION: EventAnimation = {
  mood: {
    name: "o",
    frames: [
      { opacity: 1, offset: 0.1 },
      { opacity: 1, transform: "scale(1.2)", offset: 0.45 },
      { opacity: 0, offset: 0.65 },
    ],
    rest: [
      { opacity: 0, offset: 0.1 },
      { opacity: 0, offset: 0.6 },
    ],
  },
  accessory: {
    ...stalk([
      { transform: "rotate(-35deg)", offset: 0 },
      { transform: "rotate(-35deg)", offset: 0.32 },
      { transform: "rotate(8deg)", offset: 0.6 },
    ]),
    hat: hold("translateY(5px)", 0, 0.32),
    glasses: hold("translateY(4px)", 0, 0.32),
    bowtie: hold("rotate(15deg)", 0, 0.32),
  },
  prep: 0,
  duration: 750,
  body: [
    { transform: "translateY(3px) scale(1)", offset: 0, easing: EASE_HEAD },
    { transform: "translateY(-2px) scale(1.015)", offset: 0.367, easing: EASE_HEAD },
    { transform: "translateY(0) scale(1)", offset: 0.667 },
    REST,
  ],
  eyes: [
    { transform: "scale(1)", offset: 0.32, easing: EASE_OUT },
    { transform: "scale(1.26)", offset: 0.48 },
    { transform: "scale(1.26)", offset: 0.6, easing: EASE_OUT },
    REST,
  ],
  lids: [
    { offset: 0, top: 0.85, bottom: 0.85 },
    { offset: 0.32, top: 1, bottom: 0 },
    { offset: 0.48, top: 0, bottom: 0 },
    { offset: 0.6, top: 0, bottom: 0 },
    { offset: 1 },
  ],
};

const HEAD_RADIUS_PER_GAP = 1.8;
const TURN_SPAN = Math.PI / 2 + Math.asin(1 / HEAD_RADIUS_PER_GAP);

export type TurnPose = (turn: number) => Keyframe;

function surfaceShift(gap: number, offset: number, turn: number) {
  const radius = gap * HEAD_RADIUS_PER_GAP;
  const rest = Math.asin(offset / radius);
  const angle = Math.min(Math.max(rest + turn, -Math.PI / 2), Math.PI / 2);
  return { angle, rest, x: radius * Math.sin(angle) - offset };
}

export function featureTurn(gap: number, offset: number): TurnPose {
  return (turn) => {
    const { angle, rest, x } = surfaceShift(gap, offset, turn);
    const width = Math.cos(angle) / Math.cos(rest);
    return { transform: `translateX(${x.toFixed(2)}px) scaleX(${width.toFixed(3)})` };
  };
}

export function spanTurn(gap: number): TurnPose {
  return (turn) => {
    const left = -gap + surfaceShift(gap, -gap, turn).x;
    const right = gap + surfaceShift(gap, gap, turn).x;
    const width = (right - left) / (2 * gap);
    return { transform: `translateX(${((left + right) / 2).toFixed(2)}px) scaleX(${width.toFixed(3)})` };
  };
}

export function turnAway(pose: TurnPose) {
  return {
    frames: sample(0, 1, 12, (t) => pose(TURN_SPAN * t * t)),
    timing: { duration: 300 },
  };
}

export function turnBack(pose: TurnPose) {
  return {
    frames: sample(0, 1, 12, (t) => pose(-TURN_SPAN * (1 - t) ** 2)),
    timing: { delay: 200, duration: 300, fill: "backwards" as const },
  };
}

export const SLEEP_ANIMATION: EventAnimation = {
  prep: 0,
  duration: 2970,
  body: [
    { transform: "translateY(0)", offset: 0 },
    { transform: "translateY(0)", offset: 0.67, easing: EASE_IN_OUT },
    REST,
  ],
  eyes: [],
  lids: [
    { offset: 0, top: 0, bottom: 0, easing: EASE_IN_OUT },
    { offset: 0.32, top: 1, bottom: 0, easing: EASE_OUT },
    { offset: 0.355, top: 0.24, bottom: 0, easing: EASE_IN_OUT },
    { offset: 0.63, top: 1, bottom: 0 },
    { offset: 0.67, top: 1, bottom: 0, easing: EASE_IN_OUT },
    { offset: 1 },
  ],
};

export const ERROR_ANIMATION: EventAnimation = {
  prep: 420,
  duration: 1380,
  body: [
    { transform: "translateX(0)", offset: 0, easing: "cubic-bezier(.38,0,.28,1)" },
    { transform: "translateX(-2px)", offset: 0.34, easing: "cubic-bezier(.35,0,.22,1)" },
    { transform: "translateX(2px)", offset: 0.72, easing: "cubic-bezier(.35,0,.22,1)" },
    REST,
  ],
  eyes: [
    ...sample(0, 980 / 1380, 20, (t) => ({ transform: `translateX(${(sweep(t) * 6).toFixed(2)}px)` })),
    REST,
  ],
};
