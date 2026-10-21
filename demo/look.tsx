import {
  type Accessory,
  type AvatarContent,
  type AvatarProps,
  DEFAULT_COLORS,
  type Eyes,
  type Fill,
  type Mouth,
  type MouthSlot,
  type Shape,
} from "../src/index.js";

const AGENT_DOMAINS = [
  "Inbox",
  "Billing",
  "Release",
  "Support",
  "Calendar",
  "Docs",
  "Onboarding",
  "Security",
  "Pricing",
  "Changelog",
  "CI",
  "Hiring",
  "Sales",
  "Analytics",
  "Incident",
  "Research",
];

const AGENT_ROLES = [
  "Assistant",
  "Reviewer",
  "Scout",
  "Triage",
  "Writer",
  "Watcher",
  "Planner",
  "Analyst",
  "Concierge",
  "Captain",
  "Scribe",
  "Agent",
];

function pickOne(items: readonly string[]): string {
  return items[Math.floor(Math.random() * items.length)] as string;
}

export function randomAgentName(current: string): string {
  const name = `${pickOne(AGENT_DOMAINS)} ${pickOne(AGENT_ROLES)}`;
  return name === current ? randomAgentName(current) : name;
}

export const PALETTES = [
  DEFAULT_COLORS,
  ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#F2F4F3"],
  ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF"],
  ["#15171A", "#F1F2F3", "#C7F464", "#4ECDC4", "#FF6B6B"],
];

export interface Look {
  accessory?: Accessory;
  badge: boolean;
  blink: boolean;
  content: AvatarContent;
  eyes?: Eyes;
  fill?: Fill;
  framed: boolean;
  interactive: boolean;
  motion: boolean;
  mouth?: Mouth;
  name: string;
  palette: number;
  radius: number;
  shading: number;
  shape?: Shape;
  spinner: boolean;
}

export const DEFAULT_LOOK: Look = {
  badge: false,
  blink: true,
  content: "face",
  framed: true,
  interactive: true,
  motion: true,
  name: "Chief of Staff",
  palette: 0,
  radius: 0.5,
  shading: 0,
  spinner: false,
};

function SpinnerMouth({ color, x, y }: MouthSlot) {
  return (
    <path
      d={`M${x - 6} ${y}A6 6 0 1 1 ${x} ${y + 6}`}
      fill="none"
      stroke={color}
      strokeLinecap="round"
      strokeWidth={4}
    >
      <animateTransform
        attributeName="transform"
        dur="0.8s"
        from={`0 ${x} ${y}`}
        repeatCount="indefinite"
        to={`360 ${x} ${y}`}
        type="rotate"
      />
    </path>
  );
}

export function lookProps(look: Look) {
  return {
    accessory: look.accessory,
    blink: look.blink,
    colors: PALETTES[look.palette],
    content: look.content,
    eyes: look.eyes,
    fill: look.fill,
    frame: look.framed ? look.radius : false,
    motion: look.motion,
    mouth: look.mouth,
    name: look.name.trim() || "aaavatars",
    shading: look.shading,
    shape: look.shape,
  } satisfies AvatarProps;
}

export function liveProps(look: Look) {
  return {
    ...lookProps(look),
    badge: look.badge ? (
      <span className="grid size-7 place-items-center rounded-full bg-white text-sm text-amber-500 shadow">
        ★
      </span>
    ) : undefined,
    interactive: look.interactive,
    renderMouth: look.spinner ? SpinnerMouth : undefined,
  } satisfies AvatarProps;
}
