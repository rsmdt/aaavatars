export const AVATAR_EVENTS = [
  "acknowledge",
  "handoff",
  "done",
  "success",
  "failure",
  "surprise",
  "wake",
] as const;

import type { Mood } from "./parts.js";
import type { Accessory } from "./spec.js";

export type AvatarEvent = (typeof AVATAR_EVENTS)[number];

type AccessoryFrames = Partial<Record<Exclude<Accessory, "none">, Keyframe[]>>;

interface EventAnimation {
  accessory?: AccessoryFrames;
  body: Keyframe[];
  duration: number;
  eyes: Keyframe[];
  mood?: { frames?: Keyframe[]; name: Mood; rest?: Keyframe[] };
  mouth?: Keyframe[];
}

function hold(transform: string, from: number, to: number): Keyframe[] {
  return [
    { transform, offset: from },
    { transform, offset: to },
  ];
}

function stalk(frames: Keyframe[]): AccessoryFrames {
  return { antenna: frames, sprout: frames };
}

export const MOOD_SWAP_REST: Keyframe[] = [
  { opacity: 0, offset: 0.12 },
  { opacity: 0, offset: 0.88 },
];

export const MOOD_SWAP_SHOW: Keyframe[] = [
  { opacity: 1, offset: 0.12 },
  { opacity: 1, offset: 0.88 },
];

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
    duration: 420,
    body: [
      { transform: "scale(1, 1)" },
      { transform: "scale(1.12, 0.88)" },
      { transform: "scale(0.94, 1.06)" },
      { transform: "scale(1, 1)" },
    ],
    eyes: [{ transform: "scaleY(1)" }, { transform: "scaleY(0.2)" }, { transform: "scaleY(1)" }],
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
      { transform: "translateX(0)" },
      { transform: "translateX(10px)", offset: 0.35 },
      { transform: "translateX(10px)", offset: 0.65 },
      { transform: "translateX(0)" },
    ],
    eyes: [
      { transform: "translateX(0)" },
      { transform: "translateX(6px)", offset: 0.3 },
      { transform: "translateX(6px)", offset: 0.7 },
      { transform: "translateX(0)" },
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
    duration: 700,
    body: [
      { transform: "translateY(0)" },
      { transform: "translateY(-9px)", offset: 0.3 },
      { transform: "translateY(0)", offset: 0.6 },
      { transform: "translateY(-4px)", offset: 0.8 },
      { transform: "translateY(0)" },
    ],
    eyes: [
      { transform: "scaleY(1)" },
      { transform: "scaleY(0.45)", offset: 0.25 },
      { transform: "scaleY(0.45)", offset: 0.75 },
      { transform: "scaleY(1)" },
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
    duration: 900,
    body: [
      { transform: "translateY(0) rotate(0deg) scale(1)" },
      { transform: "translateY(-9px) rotate(-8deg) scale(1.06)", offset: 0.3 },
      { transform: "translateY(-9px) rotate(8deg) scale(1.06)", offset: 0.55 },
      { transform: "translateY(0) rotate(0deg) scale(1)" },
    ],
    eyes: [
      { transform: "scaleY(1)" },
      { transform: "scaleY(0.35)", offset: 0.2 },
      { transform: "scaleY(0.35)", offset: 0.8 },
      { transform: "scaleY(1)" },
    ],
  },
  failure: {
    mood: { name: "sad" },
    accessory: {
      ...stalk(hold("rotate(30deg)", 0.2, 0.85)),
      hat: hold("translateY(4px) rotate(10deg)", 0.2, 0.85),
      glasses: hold("translateY(3px) rotate(10deg)", 0.2, 0.85),
      bowtie: hold("rotate(20deg)", 0.2, 0.85),
    },
    duration: 700,
    body: [
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)", offset: 0.15 },
      { transform: "translateX(6px)", offset: 0.3 },
      { transform: "translateX(-5px)", offset: 0.45 },
      { transform: "translateX(4px)", offset: 0.6 },
      { transform: "translateX(0)" },
    ],
    eyes: [
      { transform: "translateY(0) scaleY(1)" },
      { transform: "translateY(3px) scaleY(0.6)", offset: 0.2 },
      { transform: "translateY(3px) scaleY(0.6)", offset: 0.8 },
      { transform: "translateY(0) scaleY(1)" },
    ],
  },
  surprise: {
    mood: {
      name: "o",
      frames: [
        { opacity: 1, transform: "scale(1.3)", offset: 0.12 },
        { opacity: 1, transform: "scale(1.3)", offset: 0.75 },
        { opacity: 0, offset: 0.9 },
      ],
      rest: [
        { opacity: 0, offset: 0.12 },
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
    duration: 650,
    body: [
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-8px) scale(1.04, 1.1)", offset: 0.25 },
      { transform: "translateY(0) scale(0.97, 1.02)", offset: 0.6 },
      { transform: "translateY(0) scale(1)" },
    ],
    eyes: [
      { transform: "scale(1)" },
      { transform: "scale(1.45)", offset: 0.2 },
      { transform: "scale(1.45)", offset: 0.7 },
      { transform: "scale(1)" },
    ],
  },
  wake: {
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
        { transform: "rotate(-35deg)", offset: 0.05 },
        { transform: "rotate(-35deg)", offset: 0.35 },
        { transform: "rotate(10deg)", offset: 0.7 },
      ]),
      hat: hold("translateY(5px)", 0.05, 0.35),
      glasses: hold("translateY(4px)", 0.05, 0.35),
      bowtie: hold("rotate(15deg)", 0.05, 0.35),
    },
    duration: 800,
    body: [
      { transform: "scale(1, 1)" },
      { transform: "scale(0.96, 1.1)", offset: 0.4 },
      { transform: "scale(1.02, 0.98)", offset: 0.7 },
      { transform: "scale(1, 1)" },
    ],
    eyes: [
      { transform: "scaleY(0.12)" },
      { transform: "scaleY(0.12)", offset: 0.3 },
      { transform: "scaleY(1.2)", offset: 0.6 },
      { transform: "scaleY(1)" },
    ],
  },
};
