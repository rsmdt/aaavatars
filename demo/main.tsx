import { Circle, Hand, Palette, SlidersHorizontal, Square } from "lucide-react";
import { type ReactNode, StrictMode, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  ACCESSORIES,
  AVATAR_EVENTS,
  AVATAR_STATUSES,
  type Accessory,
  Avatar,
  type AvatarContent,
  type AvatarEvent,
  AvatarGroup,
  type AvatarHandle,
  type AvatarStatus,
  DEFAULT_COLORS,
  EYES,
  type Eyes,
  FILLS,
  type Fill,
  MOUTHS,
  type Mouth,
  type MouthSlot,
  SHAPES,
  type Shape,
  formatAvatarValue,
} from "../src/index.js";
import packageJson from "../package.json" with { type: "json" };
import { renderAvatarSvg } from "../src/server.js";


const NAMES = [
  "Chief of Staff",
  "Research",
  "Weekly Email Brief",
  "Inbox Assistant",
  "Random Writer",
  "Da Architect",
  "Existential Q&A",
  "Define",
];

const PALETTES = [
  DEFAULT_COLORS,
  ["#0B132B", "#1C2541", "#3A506B", "#5BC0BE", "#F2F4F3"],
  ["#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF"],
  ["#15171A", "#F1F2F3", "#C7F464", "#4ECDC4", "#FF6B6B"],
];

type Tab = "colors" | "options" | "behaviour";

const PANEL =
  "flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-white/90 p-2 shadow-[0_7px_30px_rgba(0,0,0,0.08)] backdrop-blur-md";

const BUTTON =
  "cursor-pointer whitespace-nowrap rounded-[10px] bg-chip px-[11px] py-2 text-xs text-chip-ink hover:bg-chip-hover active:translate-y-px";

const SELECTED = "aria-pressed:bg-ink aria-pressed:text-white";

const ICON_BUTTON = `${BUTTON} grid size-[34px] place-items-center p-0 text-knob aria-pressed:bg-chip-active aria-pressed:text-ink`;

const OPTION =
  "inline-flex items-center gap-2 rounded-[10px] bg-chip py-1.5 pr-2 pl-2.5 text-xs text-subtle";

const FIELD = "border-0 bg-transparent text-ink outline-none";

const HINT = "rounded-full border border-line bg-white/80 px-[7px] py-1";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function Choice<T extends string>({
  emptyLabel = "Auto",
  label,
  options,
  value,
  onChange,
}: {
  emptyLabel?: string;
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <label className={OPTION}>
      {label}
      <select
        className={FIELD}
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {capitalize(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Switch({
  checked,
  children,
  onChange,
}: {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={`${OPTION} cursor-pointer select-none`}>
      {children}
      <input
        checked={checked}
        className="peer sr-only"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-[18px] w-[30px] rounded-full bg-track transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.18)] after:transition-transform peer-checked:bg-knob peer-checked:after:translate-x-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
    </label>
  );
}

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

function Demo() {
  const avatar = useRef<AvatarHandle>(null);
  const [name, setName] = useState(NAMES[0] as string);
  const [status, setStatus] = useState<AvatarStatus>("idle");
  const [playing, setPlaying] = useState<AvatarEvent | null>(null);
  const [tab, setTab] = useState<Tab>("options");
  const [palette, setPalette] = useState(0);
  const [fill, setFill] = useState<Fill | undefined>();
  const [shading, setShading] = useState(0);
  const [shape, setShape] = useState<Shape | undefined>();
  const [eyes, setEyes] = useState<Eyes | undefined>();
  const [mouth, setMouth] = useState<Mouth | undefined>();
  const [accessory, setAccessory] = useState<Accessory | undefined>();
  const [content, setContent] = useState<AvatarContent>("face");
  const [blink, setBlink] = useState(true);
  const [look, setLook] = useState(true);
  const [motion, setMotion] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [badge, setBadge] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [label, setLabel] = useState("");
  const [src, setSrc] = useState("");
  const [framed, setFramed] = useState(true);
  const [radius, setRadius] = useState(0.5);
  const [copied, setCopied] = useState(false);

  const colors = PALETTES[palette];
  const frame: false | number = framed ? radius : false;
  const value = formatAvatarValue({ shape, eyes, mouth, accessory, fill });
  const avatarProps = {
    accessory,
    blink,
    colors,
    content,
    eyes,
    fill,
    frame,
    label: label || undefined,
    look,
    motion,
    mouth,
    name,
    shading,
    shape,
    src: src || undefined,
    status,
  };

  async function play(event: AvatarEvent) {
    setPlaying(event);
    await avatar.current?.play(event);
    setPlaying((current) => (current === event ? null : current));
  }

  function randomize() {
    const others = NAMES.filter((candidate) => candidate !== name);
    setName(others[Math.floor(Math.random() * others.length)] as string);
    setShape(undefined);
    setEyes(undefined);
    setMouth(undefined);
    setAccessory(undefined);
  }

  async function copySvg() {
    await navigator.clipboard.writeText(renderAvatarSvg({ ...avatarProps, size: 256 }));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center gap-2.5 bg-canvas bg-[radial-gradient(var(--color-dot)_1px,transparent_1px)] bg-size-[24px_24px] px-7 pt-[18vh] pb-16">
      <div className="absolute top-[22px] left-7 text-[13px] tracking-[0.04em] text-muted">
        aaavatars / SVG + React / play() API
      </div>
      <div className="absolute top-5 right-7 rounded-full border border-[#e0e1e3] bg-white/80 px-[7px] py-[3px] text-[10px] text-subtle">
        Demo {packageJson.version}
      </div>

      <div className="mb-6 grid place-items-center">
        <Avatar
          ref={avatar}
          {...avatarProps}
          badge={
            badge ? (
              <span className="grid size-7 place-items-center rounded-full bg-white text-sm text-amber-500 shadow">
                ★
              </span>
            ) : undefined
          }
          interactive={interactive}
          renderMouth={spinner ? SpinnerMouth : undefined}
          size={120}
        />
      </div>

      <div
        className="rounded-full border border-line bg-white px-2.5 py-1.5 text-[11px] text-[#858990]"
        aria-live="polite"
      >
        {playing ? `play · ${capitalize(playing)}` : `${status} · ${capitalize(status)}`}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[9.5px] text-[#858990]">
        <strong className="font-semibold">Try:</strong>
        <span className={HINT}>Hover the avatar</span>
        <span className={HINT}>Click or double-click it</span>
        <span className={HINT}>Drag it in any direction</span>
        <span className={HINT}>Press and hold it</span>
      </div>

      <div className={`${PANEL} flex-col`}>
        <div className="flex flex-wrap justify-center gap-1.5">
          {AVATAR_STATUSES.map((option) => (
            <button
              key={option}
              aria-pressed={status === option}
              className={`${BUTTON} ${SELECTED}`}
              type="button"
              onClick={() => setStatus(option)}
            >
              {capitalize(option)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {AVATAR_EVENTS.map((event) => (
            <button key={event} className={BUTTON} type="button" onClick={() => void play(event)}>
              play({event})
            </button>
          ))}
          <button className={BUTTON} type="button" onClick={randomize}>
            Random
          </button>
        </div>
      </div>

      <div className={PANEL}>
        {(
          [
            ["colors", "Colors", <Palette key="colors" size={18} />],
            ["options", "Options", <SlidersHorizontal key="options" size={18} />],
            ["behaviour", "Behaviour", <Hand key="behaviour" size={18} />],
          ] as const
        ).map(([key, title, icon]) => (
          <button
            key={key}
            aria-label={title}
            aria-pressed={tab === key}
            className={ICON_BUTTON}
            title={title}
            type="button"
            onClick={() => setTab(key)}
          >
            {icon}
          </button>
        ))}
      </div>

      {tab === "colors" ? (
        <div className={`${PANEL} max-w-[760px]`}>
          {PALETTES.map((swatches, index) => (
            <button
              key={swatches.join()}
              aria-label={`Palette ${index + 1}`}
              aria-pressed={palette === index}
              className={`${BUTTON} flex p-1.5 aria-pressed:ring-2 aria-pressed:ring-ink`}
              type="button"
              onClick={() => setPalette(index)}
            >
              {swatches.map((color) => (
                <i
                  key={color}
                  className="h-[18px] w-3 first:rounded-l last:rounded-r"
                  style={{ background: color }}
                />
              ))}
            </button>
          ))}
          <Choice label="Fill" options={FILLS} value={fill} onChange={setFill} />
          <label className={OPTION}>
            Shading
            <input
              aria-label="Shading"
              className="w-24 accent-knob"
              max={1}
              min={0}
              step={0.05}
              type="range"
              value={shading}
              onChange={(event) => setShading(Number(event.target.value))}
            />
          </label>
          <button
            className={`${BUTTON} font-semibold`}
            type="button"
            onClick={() => {
              setPalette(0);
              setFill(undefined);
              setShading(0);
            }}
          >
            Reset colors
          </button>
        </div>
      ) : null}

      {tab === "options" ? (
        <div className={`${PANEL} max-w-[760px]`}>
          <label className={OPTION}>
            Name
            <select
              className={FIELD}
              value={name}
              onChange={(event) => setName(event.target.value)}
            >
              {NAMES.map((candidate) => (
                <option key={candidate}>{candidate}</option>
              ))}
            </select>
          </label>
          <Choice label="Shape" options={SHAPES} value={shape} onChange={setShape} />
          <Choice label="Eyes" options={EYES} value={eyes} onChange={setEyes} />
          <Choice
            emptyLabel="None"
            label="Mouth"
            options={MOUTHS.filter((option) => option !== "none")}
            value={mouth}
            onChange={setMouth}
          />
          <Choice
            emptyLabel="None"
            label="Accessory"
            options={ACCESSORIES.filter((option) => option !== "none")}
            value={accessory}
            onChange={setAccessory}
          />
          <Switch
            checked={content === "initial"}
            onChange={(checked) => setContent(checked ? "initial" : "face")}
          >
            Initial
          </Switch>
        </div>
      ) : null}

      {tab === "behaviour" ? (
        <div className={`${PANEL} max-w-[760px]`}>
          <Switch checked={blink} onChange={setBlink}>
            Blink
          </Switch>
          <Switch checked={look} onChange={setLook}>
            Pointer follow
          </Switch>
          <Switch checked={motion} onChange={setMotion}>
            Loop
          </Switch>
          <Switch checked={interactive} onChange={setInteractive}>
            Interactive
          </Switch>
          <Switch checked={badge} onChange={setBadge}>
            Badge
          </Switch>
          <Switch checked={spinner} onChange={setSpinner}>
            Spinner mouth
          </Switch>
          <label className={OPTION}>
            Label
            <input
              className={`${FIELD} w-36`}
              placeholder="Searching the web…"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <label className={OPTION}>
            Image URL
            <input
              className={`${FIELD} w-44`}
              placeholder="https://…"
              value={src}
              onChange={(event) => setSrc(event.target.value)}
            />
          </label>
        </div>
      ) : null}

      <div
        className={`${PANEL} gap-[9px] rounded-full px-3 py-1.5 text-[11px] font-semibold text-subtle`}
      >
        Frame roundness
        <Square aria-hidden className="text-muted" size={16} />
        <input
          aria-label="Frame roundness"
          className="w-[150px] accent-knob"
          disabled={!framed}
          max={0.5}
          min={0}
          step={0.01}
          type="range"
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <Circle aria-hidden className="text-muted" size={16} />
        <label className="inline-flex cursor-pointer items-center gap-2 select-none">
          Frame
          <input
            checked={framed}
            className="peer sr-only"
            type="checkbox"
            onChange={(event) => setFramed(event.target.checked)}
          />
          <span className="relative h-[18px] w-[30px] rounded-full bg-track transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.18)] after:transition-transform peer-checked:bg-knob peer-checked:after:translate-x-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
        </label>
      </div>

      <div className={`${PANEL} gap-3 rounded-full px-3 py-1.5 text-[11px] text-subtle`}>
        <span className="font-semibold">Value</span>
        <code className="font-mono text-ink">{value || "(all from name)"}</code>
        <button className={BUTTON} type="button" onClick={() => void copySvg()}>
          {copied ? "Copied" : "Copy SVG"}
        </button>
      </div>

      <div
        className={`${PANEL} gap-3 rounded-full px-3 py-1.5 text-[11px] font-semibold text-subtle`}
      >
        Group
        <AvatarGroup
          max={6}
          members={[
            { name: "Rudolf", content: "initial", colors: ["#E1E2E5", "#5F646C"], frame },
            ...NAMES.map((member) => ({ name: member, colors, fill, frame, shading })),
          ]}
          size={30}
        />
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
