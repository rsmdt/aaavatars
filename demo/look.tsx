import {
  type Accessory,
  type AvatarContent,
  type AvatarProps,
  DEFAULT_COLORS,
  type Eyes,
  type Fill,
  type Mouth,
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

export function randomTeam(size: number): string[] {
  const names = new Set<string>();
  while (names.size < size) names.add(randomAgentName(""));
  return [...names];
}

export const PALETTES = [
  DEFAULT_COLORS,
  ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#F2F4F3"],
  ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF"],
  ["#15171A", "#F1F2F3", "#C7F464", "#4ECDC4", "#FF6B6B"],
];

export interface Look {
  accessory?: Accessory;
  blink: boolean;
  content: AvatarContent;
  dot: boolean;
  eyes?: Eyes;
  fill?: Fill;
  framed: boolean;
  interactive: boolean;
  loop: boolean;
  mouth?: Mouth;
  name: string;
  palette: number;
  radius: number;
  shading: number;
  shape?: Shape;
  team: string[];
}

export const DEFAULT_LOOK: Look = {
  blink: true,
  content: "face",
  dot: false,
  framed: true,
  interactive: true,
  loop: true,
  name: "Chief of Staff",
  palette: 0,
  radius: 0.2,
  shading: 0,
  team: [
    "Chief of Staff",
    "Research",
    "Weekly Email Brief",
    "Inbox Assistant",
    "Random Writer",
    "Da Architect",
    "Existential Q&A",
  ],
};

export function lookProps(look: Look) {
  return {
    accessory: look.accessory,
    blink: look.blink,
    colors: PALETTES[look.palette],
    content: look.content,
    eyes: look.eyes,
    fill: look.fill,
    frame: look.framed ? look.radius : undefined,
    loop: look.loop,
    mouth: look.mouth,
    name: look.name.trim() || "aaavatars",
    shading: look.shading,
    shape: look.shape,
  } satisfies AvatarProps;
}

export function liveProps(look: Look) {
  return {
    ...lookProps(look),
    dot: look.dot,
    interactive: look.interactive,
  } satisfies AvatarProps;
}
