import { useEffect, useRef, useState } from "react";

import {
  ACTIVITIES,
  AVATAR_EVENTS,
  type Activity,
  Avatar,
  type AvatarEvent,
  AvatarGroup,
  type AvatarHandle,
  EXPRESSIONS,
  type Expression,
  GAZES,
  type Gaze,
} from "../src/index.js";
import { Appearance } from "./Appearance.js";
import { type Look, PALETTES, liveProps, randomAgentName, randomTeam } from "./look.js";
import {
  CARD,
  CODE_BLOCK,
  CopyButton,
  DARK_BUTTON,
  FIELD,
  PLAYING_RING,
  Pills,
  SLIDER,
  Select,
  Switch,
} from "./ui.js";

type PropValue =boolean | number | readonly string[] | string | undefined;

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

  function shuffle() {
    onLookChange({
      name: randomAgentName(look.name),
      team: randomTeam(look.team.length),
      shape: undefined,
      eyes: undefined,
      mouth: undefined,
      accessory: undefined,
    });
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
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 lg:max-w-none [&_.flex-wrap]:justify-center">
      <div className="flex w-full max-w-sm gap-2">
        <input
          aria-label="Name"
          className={`${FIELD} min-w-0 flex-1`}
          value={look.name}
          onChange={(event) => onLookChange({ name: event.target.value })}
        />
        <button className={DARK_BUTTON} type="button" onClick={shuffle}>
          Shuffle
        </button>
      </div>
      <div className="flex w-full flex-col items-center gap-6 lg:grid lg:grid-cols-[1fr_minmax(0,24rem)_1fr] lg:grid-rows-[auto_auto] lg:gap-x-12 lg:gap-y-0">
        <div className="flex w-full max-w-sm flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
          <div className={`${CARD} p-5`}>
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
          <div className="flex justify-center">
            <AvatarGroup
              max={6}
              members={[
                { name: "Rudolf", content: "initial", colors: ["#E1E2E5", "#5F646C"], frame: props.frame },
                ...look.team.map((member) => ({
                  name: member,
                  colors: props.colors,
                  fill: look.fill,
                  frame: props.frame,
                  shading: look.shading,
                })),
              ]}
              size={30}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid lg:gap-0 lg:items-end lg:justify-items-end lg:divide-y lg:divide-line lg:[&>*]:py-6 lg:[&>:last-child]:self-start lg:[&_.flex-wrap]:justify-end">
          <Pills
            label={(option) => option}
            options={ACTIVITIES}
            value={activity}
            onChange={setActivity}
          />
          <div className="flex flex-wrap gap-2">
            <Select
              label="Expression"
              options={EXPRESSIONS}
              value={expression}
              onChange={(option) => setExpression(option ?? "neutral")}
            />
            <Select
              emptyLabel="auto"
              label="Gaze"
              options={GAZES}
              value={gaze}
              onChange={setGaze}
            />
          </div>
        </div>
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:grid lg:grid-rows-subgrid lg:gap-0 lg:items-end lg:divide-y lg:divide-line lg:[&>*]:py-6 lg:[&>:last-child]:self-start lg:[&_.flex-wrap]:justify-start">
          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            <Switch checked={look.framed} onChange={(framed) => onLookChange({ framed })}>
              Frame
            </Switch>
            <label className={SLIDER}>
              Roundness
              <input
                aria-label="Frame roundness"
                className="w-20 accent-knob"
                disabled={!look.framed}
                max={0.5}
                min={0}
                step={0.1}
                type="range"
                value={look.radius}
                onChange={(event) => onLookChange({ radius: Number(event.target.value) })}
              />
            </label>
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl [&_h3]:text-center">
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
