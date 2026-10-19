export const AVATAR_EVENTS = [
  "acknowledge",
  "handoff",
  "done",
  "success",
  "warning",
  "error",
  "surprised",
  "angry",
  "love",
] as const;

import type { Mood } from "./parts.js";
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
  lids?: LidFrame[];
  mood?: { frames?: Keyframe[]; name: Mood; rest?: Keyframe[] };
  mouth?: Keyframe[];
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

const REST: Keyframe = { offset: 1 };

function nodDepth(ms: number): number {
  if (ms < 150) return ms / 150;
  if (ms < 300) return 1 - (ms - 150) / 150;
  if (ms < 450) return (ms - 300) / 150;
  return Math.max(0, 1 - (ms - 450) / 310);
}

function bob(amplitude: number) {
  return (t: number): Keyframe => ({
    transform: `translateY(${(Math.sin(t * Math.PI * 4) * amplitude * (1 - 0.38 * t)).toFixed(2)}px)`,
  });
}

function spring(amount: number) {
  return (t: number): Keyframe => ({
    transform: `translateY(${(amount * (1 - Math.exp(-5.2 * t) * Math.cos(8.6 * t))).toFixed(2)}px)`,
  });
}

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

const HEART = { rx: 7.5, ry: 11.5, tilt: 42, cross: 0.48 };

export function heartPose(side: -1 | 1, { gap, h, w }: EyeSize): string {
  const inward = -side * (gap + HEART.rx * HEART.cross);
  return `translateX(${inward.toFixed(2)}px) rotate(${side * HEART.tilt}deg) scale(${(HEART.rx / w).toFixed(3)}, ${(HEART.ry / h).toFixed(3)})`;
}

function beats(from: number, beat: number, count: number): Keyframe[] {
  return Array.from({ length: count }, (_, index) => {
    const start = from + index * beat;
    return [
      { offset: start, transform: "scale(1)", easing: EASE_SINE },
      { offset: start + beat * 0.12, transform: "scale(1.155)", easing: EASE_SINE },
      { offset: start + beat * 0.24, transform: "scale(1)", easing: EASE_SINE },
      { offset: start + beat * 0.36, transform: "scale(1.093)", easing: EASE_SINE },
      { offset: start + beat * 0.48, transform: "scale(1)", easing: "linear" },
    ];
  }).flat();
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
    mouth: hold("translateX(5px)", 0.35, 0.65),
    accessory: {
      ...stalk(hold("rotate(-15deg)", 0.35, 0.65)),
      hat: hold("translateX(3px) rotate(6deg)", 0.35, 0.65),
      glasses: hold("translateX(4px)", 0.3, 0.7),
      bowtie: hold("rotate(-12deg)", 0.35, 0.65),
    },
    duration: 900,
    body: [
      { transform: "translateX(0)", easing: EASE_IN_OUT },
      { transform: "translateX(6px)", offset: 0.35 },
      { transform: "translateX(6px)", offset: 0.65, easing: EASE_IN_OUT },
      REST,
    ],
    eyes: [
      { transform: "translateX(0)" },
      { transform: "translateX(6px)", offset: 0.2 },
      { transform: "translateX(6px)", offset: 0.7, easing: EASE_IN_OUT },
      REST,
    ],
  },
  done: {
    mood: { name: "happy" },
    accessory: {
      antenna: [{ transform: "scaleY(1.25)", offset: 0.3 }],
      sprout: [{ transform: "scale(1.25)", offset: 0.3 }],
      hat: hold("translateY(-3px) rotate(-10deg)", 0.3, 0.7),
      glasses: [{ transform: "translateY(-3px)", offset: 0.3 }],
      bowtie: [{ transform: "scale(1.3)", offset: 0.3 }],
    },
    duration: 1100,
    body: [
      { transform: "translateY(0)", offset: 0, easing: EASE_HEAD },
      { transform: "translateY(-1.5px)", offset: 0.3, easing: EASE_HEAD },
      { transform: "translateY(0)", offset: 0.6 },
      REST,
    ],
    eyes: [...sample(0.2, 0.6, 10, bob(1.8)), REST],
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 0.2, top: 0, bottom: 1 },
      { offset: 0.65, top: 0, bottom: 1, easing: EASE_IN_OUT },
      { offset: 1 },
    ],
  },
  success: {
    mood: {
      name: "happy",
      frames: [
        { opacity: 1, transform: "scale(1.15)", offset: 0.12 },
        { opacity: 1, transform: "scale(1.15)", offset: 0.88 },
      ],
    },
    accessory: {
      antenna: [
        { transform: "rotate(-20deg)", offset: 0.2 },
        { transform: "rotate(20deg)", offset: 0.45 },
        { transform: "rotate(-10deg)", offset: 0.7 },
      ],
      sprout: hold("scale(1.35)", 0.3, 0.7),
      hat: hold("translateY(-4px) rotate(-15deg)", 0.3, 0.7),
      glasses: hold("translateY(-4px)", 0.3, 0.7),
      bowtie: hold("scale(1.35)", 0.3, 0.7),
    },
    duration: 1500,
    body: [
      { transform: "translateY(0)", offset: 0, easing: EASE_HEAD },
      { transform: "translateY(-1.2px)", offset: 0.21, easing: EASE_HEAD },
      { transform: "translateY(0)", offset: 0.51 },
      REST,
    ],
    eyes: [...sample(0.147, 0.56, 16, bob(2.5)), REST],
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 0.147, top: 0, bottom: 1 },
      { offset: 0.653, top: 0, bottom: 1, easing: EASE_OUT },
      { offset: 1 },
    ],
  },
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
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 0.14, top: 0.8, bottom: 0, tilt: 16 },
      { offset: 0.772, top: 0.8, bottom: 0, tilt: 16, easing: EASE_OUT },
      { offset: 1 },
    ],
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
  angry: {
    mood: { name: "sad" },
    accessory: {
      ...stalk(hold("rotate(-20deg)", 0.15, 0.65)),
      hat: hold("translateY(3px) rotate(-6deg)", 0.15, 0.65),
      glasses: hold("translateY(3px)", 0.15, 0.65),
      bowtie: hold("rotate(-14deg)", 0.15, 0.65),
    },
    duration: 1480,
    body: [
      { transform: "translateY(0)", offset: 0, easing: EASE_HEAD },
      { transform: "translateY(1.3px)", offset: 0.255, easing: EASE_HEAD },
      { transform: "translateY(0)", offset: 0.554 },
      REST,
    ],
    eyes: [
      ...sample(0, 0.46, 10, spring(2)),
      { transform: "translateY(2px)", offset: 0.662, easing: EASE_OUT },
      REST,
    ],
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 0.19, top: 0.83, bottom: 0, tilt: -16 },
      { offset: 0.662, top: 0.83, bottom: 0, tilt: -16, easing: EASE_OUT },
      { offset: 1 },
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
  love: {
    mood: { name: "happy" },
    accessory: {
      ...stalk(hold("rotate(-10deg)", 0.1, 0.85)),
      hat: hold("translateY(-2px)", 0.1, 0.85),
      glasses: hold("translateY(-6px)", 0.05, 0.9),
      bowtie: hold("scale(1.2)", 0.1, 0.85),
    },
    prep: 280,
    duration: 2880,
    body: [
      { transform: "translateY(0) rotate(0deg)", offset: 0, easing: "cubic-bezier(.38,0,.25,1)" },
      { transform: "translateY(-1px)", offset: 0.3, easing: "cubic-bezier(.35,0,.22,1)" },
      { transform: "translateY(-0.5px)", offset: 0.68, easing: "cubic-bezier(.35,0,.22,1)" },
      REST,
    ],
    eyes: [{ transform: "scale(1)", offset: 0 }, ...beats(240 / 2880, 760 / 2880, 3), REST],
    eye: (side, size) => [
      { transform: "none", offset: 0, easing: EASE_SINE },
      { transform: heartPose(side, size), offset: 240 / 2880 },
      { transform: heartPose(side, size), offset: 2520 / 2880, easing: EASE_SINE },
      REST,
    ],
    lids: [
      { offset: 0, top: 0, bottom: 0 },
      { offset: 2520 / 2880, top: 0, bottom: 0 },
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
