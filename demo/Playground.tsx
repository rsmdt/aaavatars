import { useEffect, useRef, useState } from "react";

import {
  ACTIVITIES,
  AVATAR_EVENTS,
  EVENT_LAYERS,
  type Activity,
  Avatar,
  type AvatarEvent,
  type AvatarHandle,
  EXPRESSIONS,
  type Expression,
  GAZES,
  type Gaze,
} from "../src/index.js";
import { Appearance } from "./Appearance.js";
import { type Look, PALETTES, liveProps } from "./look.js";
import { BUTTON, CARD, CODE_BLOCK, CopyButton, PLAYING_RING, Pills, Select } from "./ui.js";

type PropValue = boolean | number | readonly string[] | string | undefined;

function avatarSnippet(props: Record<string, PropValue>): string {
  const attributes = Object.entries(props).flatMap(([key, value]) => {
    if (value === undefined) return [];
    if (value === true) return [`  ${key}`];
    if (typeof value === "string") return [`  ${key}=${JSON.stringify(value)}`];
    return [`  ${key}={${JSON.stringify(value)}}`];
  });
  return `import { Avatar } from "aaavatars";\n\n<Avatar\n${attributes.join("\n")}\n/>`;
}

function frameProp(look: Look): false | number | undefined {
  if (!look.framed) return false;
  return look.radius === 0.5 ? undefined : look.radius;
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("input, select, textarea") !== null;
}

function isPressable(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button, label") !== null;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)] as T;
}

export function Playground({
  look,
  onLookChange,
}: {
  look: Look;
  onLookChange: (patch: Partial<Look>) => void;
}) {
  const avatar = useRef<AvatarHandle>(null);
  const lastEvent = useRef<AvatarEvent>(AVATAR_EVENTS[0]);
  const [activity, setActivity] = useState<Activity>("idle");
  const [expression, setExpression] = useState<Expression>("neutral");
  const [gaze, setGaze] = useState<Gaze | undefined>();
  const [playing, setPlaying] = useState<AvatarEvent | null>(null);
  const shown = playing ? EVENT_LAYERS[playing] : null;

  const props = liveProps(look);
  const code = avatarSnippet({
    name: props.name,
    activity: activity === "idle" ? undefined : activity,
    expression: expression === "neutral" ? undefined : expression,
    gaze,
    shape: look.shape,
    eyes: look.eyes,
    mouth: look.mouth,
    accessory: look.accessory,
    colors: look.palette === 0 ? undefined : PALETTES[look.palette],
    fill: look.fill,
    shading: look.shading || undefined,
    frame: frameProp(look),
    content: look.content === "face" ? undefined : look.content,
    blink: look.blink ? undefined : false,
    motion: look.motion ? undefined : false,
    interactive: look.interactive || undefined,
  });

  function play(event: AvatarEvent) {
    lastEvent.current = event;
    void avatar.current?.play(event);
  }

  function surprise() {
    setActivity(pickRandom(ACTIVITIES.filter((option) => option !== "sleeping")));
    setExpression(pickRandom(EXPRESSIONS));
    setGaze(pickRandom([undefined, ...GAZES]));
    play("surprised");
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return;
      const replay = event.key === " " && !isPressable(event.target);
      const picked = replay ? lastEvent.current : AVATAR_EVENTS[Number(event.key) - 1];
      if (!picked) return;
      event.preventDefault();
      play(picked);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 [&_.flex-wrap]:justify-center">
      <div className={`${CARD} flex w-full max-w-sm flex-col gap-5 p-5`}>
        <div className="flex justify-end gap-2">
          <button className={BUTTON} type="button" onClick={surprise}>
            Surprise me
          </button>
        </div>

        <div className="grid place-items-center py-6">
          <Avatar
            ref={avatar}
            {...props}
            activity={activity}
            expression={expression}
            gaze={gaze}
            size={200}
            onChange={setPlaying}
          />
        </div>
      </div>

      <Pills
        label={(option) => option}
        options={ACTIVITIES}
        playing={shown !== null}
        value={activity}
        onChange={setActivity}
      />
      <div className="flex flex-wrap gap-2">
        <Select
          label="Expression"
          options={EXPRESSIONS}
          playing={shown !== null}
          value={shown?.expression ?? expression}
          onChange={(option) => setExpression(option ?? "neutral")}
        />
        <Select
          emptyLabel="auto"
          label="Gaze"
          options={GAZES}
          playing={shown !== null}
          value={shown?.gaze ?? gaze}
          onChange={setGaze}
        />
      </div>
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AVATAR_EVENTS.map((event, index) => (
            <button
              key={event}
              className={`flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2 font-mono text-[13px] hover:bg-chip active:translate-y-px ${PLAYING_RING}`}
              data-playing={playing === event || undefined}
              type="button"
              onClick={() => play(event)}
            >
              {event}
              <kbd className="rounded border border-line px-1.5 font-mono text-[11px] text-subtle">
                {index + 1}
              </kbd>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-muted">
          Keys 1–8 play a reaction. Space replays the last one.
        </p>
      </div>
      <div className="w-full [&_h3]:text-center [&_input[aria-label=Name]]:max-w-sm">
        <Appearance look={look} onChange={onLookChange} />
      </div>
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-ink">
        <div className="flex items-center justify-between border-b border-white/10 py-2 pr-2 pl-5 font-mono text-xs text-muted">
          tsx
          <CopyButton text={code} />
        </div>
        <pre className={`${CODE_BLOCK} rounded-none`}>{code}</pre>
      </div>
    </div>
  );
}
