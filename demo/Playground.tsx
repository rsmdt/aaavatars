import { type ReactNode, useEffect, useRef, useState } from "react";

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
import { type Look, liveProps } from "./look.js";
import { BUTTON, CARD, CopyButton, PLAYING_RING, Pills } from "./ui.js";

function avatarCode(props: Record<string, string | undefined>): string {
  const attributes = Object.entries(props)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}="${value}"`);
  return `<Avatar ${attributes.join(" ")} />`;
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

function LayerSection({
  children,
  index,
  lasts,
  question,
  title,
}: {
  children: ReactNode;
  index: number;
  lasts?: string;
  question: string;
  title: string;
}) {
  return (
    <section className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-subtle">{String(index).padStart(2, "0")}</span>
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-[15px] text-subtle">{question}</span>
        {lasts ? <span className="ml-auto text-xs text-subtle">{lasts}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function Playground({ look }: { look: Look }) {
  const avatar = useRef<AvatarHandle>(null);
  const lastEvent = useRef<AvatarEvent>(AVATAR_EVENTS[0]);
  const [activity, setActivity] = useState<Activity>("idle");
  const [expression, setExpression] = useState<Expression>("neutral");
  const [gaze, setGaze] = useState<Gaze | undefined>();
  const [playing, setPlaying] = useState<AvatarEvent | null>(null);
  const shown = playing ? EVENT_LAYERS[playing] : null;

  const props = liveProps(look);
  const code = avatarCode({
    name: props.name,
    activity,
    expression: expression === "neutral" ? undefined : expression,
    gaze,
    shape: look.shape,
    eyes: look.eyes,
    mouth: look.mouth,
    accessory: look.accessory,
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
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4 self-start lg:sticky lg:top-6">
        <div className={`${CARD} flex flex-col gap-5 p-5`}>
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
        <div className="flex items-center gap-2 rounded-xl border border-line bg-white py-1.5 pr-1.5 pl-3">
          <code className="min-w-0 flex-1 font-mono text-[13px] [overflow-wrap:anywhere]">{code}</code>
          <CopyButton text={code} />
        </div>
      </div>

      <div>
        <LayerSection
          index={1}
          question="What is it doing?"
          title="Activity"
        >
          <Pills
            label={(option) => option}
            options={ACTIVITIES}
            value={activity}
            onChange={setActivity}
          />
        </LayerSection>
        <LayerSection
          index={2}
          question="How does it feel?"
          title="Expression"
        >
          <Pills
            label={(option) => option}
            options={EXPRESSIONS}
            playing={(option) => option === shown?.expression}
            value={expression}
            onChange={setExpression}
          />
        </LayerSection>
        <LayerSection
          index={3}
          question="Where is it looking?"
          title="Gaze"
        >
          <Pills
            label={(option) => option ?? "auto"}
            options={[undefined, ...GAZES]}
            playing={(option) => shown !== null && option === shown.gaze}
            value={gaze}
            onChange={setGaze}
          />
        </LayerSection>
        <LayerSection
          index={4}
          lasts="1–3s, then back to rest"
          question="What just happened?"
          title="Event"
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {AVATAR_EVENTS.map((event, index) => (
              <button
                key={event}
                className={`flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white px-3.5 py-2.5 font-mono text-[13px] hover:bg-chip active:translate-y-px ${PLAYING_RING}`}
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
          <p className="mt-3 text-xs text-muted">
            Keys 1–9 play an event after a half-second settle. Space replays the last one.
          </p>
        </LayerSection>
      </div>
    </div>
  );
}
