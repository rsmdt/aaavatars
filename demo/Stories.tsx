import { type ReactNode, useEffect, useRef, useState } from "react";

import { Avatar, type AvatarHandle } from "../src/index.js";
import { QUOTES, TASK_STEPS, WORKERS } from "./copy.js";
import { CARD, SectionTitle } from "./ui.js";

const TASK_STEP_MS = 2600;

function Story({
  children,
  code,
  flipped = false,
  index,
  text,
  title,
}: {
  children: ReactNode;
  code: string;
  flipped?: boolean;
  index: number;
  text: string;
  title: string;
}) {
  return (
    <article className="grid items-center gap-10 border-t border-line py-14 lg:grid-cols-2">
      <div className={flipped ? "lg:order-2" : undefined}>
        <span className="font-mono text-xs text-subtle">{String(index).padStart(2, "0")}</span>
        <h3 className="mt-2 text-3xl font-bold tracking-tight">{title}</h3>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-subtle">{text}</p>
        <code className="mt-4 block font-mono text-[13px] text-subtle">{code}</code>
      </div>
      <div className={`${CARD} p-5`}>{children}</div>
    </article>
  );
}

function BlackBox() {
  return (
    <div className="grid grid-cols-2 divide-x divide-line text-center">
      <div className="flex flex-col items-center gap-4 p-4">
        <span className="font-mono text-xs tracking-widest text-subtle">WITHOUT</span>
        <span className="grid h-24 place-items-center">
          <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-muted" />
        </span>
        <span className="text-[15px]">Processing request…</span>
        <span className="-mt-3 text-xs text-subtle">0:38 · is it stuck?</span>
      </div>
      <div className="flex flex-col items-center gap-4 p-4">
        <span className="font-mono text-xs tracking-widest text-subtle">WITH</span>
        <Avatar activity="reading" expression="happy" name="Analyst" size={96} />
        <span className="text-[15px]">On it. Reading last quarter's numbers.</span>
        <span className="-mt-3 text-xs text-subtle">0:38 · on sheet 4 of 6</span>
      </div>
    </div>
  );
}

function BackgroundWork() {
  const avatar = useRef<AvatarHandle>(null);
  const [step, setStep] = useState(0);
  const current = TASK_STEPS[step] ?? TASK_STEPS[0]!;

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (step < TASK_STEPS.length - 1) {
        setStep(step + 1);
        return;
      }
      await avatar.current?.play("success");
      if (!cancelled) setStep(0);
    }, TASK_STEP_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [step]);

  return (
    <div>
      <div className="flex items-center gap-5">
        <Avatar ref={avatar} activity={current.activity} name="Background Worker" size={72} />
        <div className="min-w-0">
          <span className="rounded-full border border-[#e3c9bf] bg-[#f7ece7] px-2 py-0.5 font-mono text-[11px] text-[#9a4a2c]">
            ● App closed · still running in the cloud
          </span>
          <div className="mt-1.5 text-lg font-semibold">{current.task}</div>
          <div className="font-mono text-xs text-subtle">
            Step {step + 1} of {TASK_STEPS.length} · activity="{current.activity}"
          </div>
        </div>
      </div>
      <div className="mt-5 h-[3px] rounded-full bg-line">
        <div
          className="h-full rounded-full bg-[#b5603f] transition-[width] duration-500"
          style={{ width: `${((step + 1) / TASK_STEPS.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 divide-y divide-line rounded-2xl border border-line bg-white">
        {TASK_STEPS.map((item, index) => (
          <li
            key={item.task}
            className={`flex items-center gap-3 px-4 py-2.5 text-[15px] ${index > step ? "text-muted" : ""} ${index === step ? "font-semibold" : ""}`}
          >
            <span
              className={`size-2.5 rounded-full ${index < step ? "bg-ink" : index === step ? "bg-[#b5603f]" : "border border-muted"}`}
            />
            {item.task}
            <span className="ml-auto font-mono text-xs text-subtle">{item.tool}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Workers() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {WORKERS.map((worker) => (
        <div
          key={worker.name}
          className={`rounded-2xl border border-line p-4 ${worker.activity === "asking" ? "bg-[#f3e9e3]" : "bg-white"}`}
        >
          <div className="flex items-center gap-3">
            <Avatar
              activity={worker.activity}
              expression={worker.expression}
              name={worker.name}
              size={44}
            />
            <div>
              <div className="font-semibold">{worker.name}</div>
              <div className="font-mono text-xs text-subtle">{worker.app}</div>
            </div>
          </div>
          <div className="mt-3 text-[15px]">{worker.task}</div>
          <div className="mt-1 font-mono text-xs text-subtle">
            activity="{worker.activity}"{worker.expression ? ` · ${worker.expression}` : ""}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WhyAFace() {
  return (
    <section>
      <SectionTitle
        aside="Persistent agents run for hours, across your apps, on computers you never see. A small, readable face is how people learn to trust them."
        eyebrow="Why a face"
        title={
          <>
            Agents work while you're away.
            <br />A face keeps them close.
          </>
        }
      />
      <Story
        code={`activity="reading" expression="happy"`}
        index={1}
        text="An agent that acts on its own can feel like an opaque machine. Give the same work a friendly face and it reads as a capable helper. You can tell at a glance that it's busy, pleased, or stuck."
        title="A little buddy, not a black box."
      >
        <BlackBox />
      </Story>
      <Story
        code={`activity changes per step · play("success") at the end`}
        flipped
        index={2}
        text={`Persistent agents keep going long after the app is closed. A spinner only says "something is happening". The face shows what is happening: reading, planning, coding, waiting on CI.`}
        title="Background work you can see."
      >
        <BackgroundWork />
      </Story>
      <Story
        code={`one name per agent · activity="asking" when it needs you`}
        index={3}
        text="When several agents run your workflows across mail, sheets and code, each one needs an identity you recognise. The same name always draws the same character, so you know who is triaging the inbox, and who is waiting on you."
        title="One face per worker."
      >
        <Workers />
      </Story>
    </section>
  );
}

export function LovedByBots() {
  return (
    <section>
      <SectionTitle
        aside="Every face here is the same component with its own name. Hover the row to pause it."
        eyebrow="Testimonials"
        title="Loved by bots."
      />
      <div className="mx-[calc(50%-50vw)] overflow-x-auto motion-safe:overflow-hidden">
        <div className="flex w-max pl-6 motion-safe:animate-marquee motion-safe:pl-0 motion-safe:hover:[animation-play-state:paused]">
          {[...QUOTES, ...QUOTES].map((quote, index) => (
            <figure
              key={`${quote.handle}-${index}`}
              aria-hidden={index >= QUOTES.length}
              className="mr-4 w-[300px] shrink-0 rounded-2xl border border-line bg-white p-5"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  activity={quote.activity}
                  expression={quote.expression}
                  name={quote.handle}
                  size={44}
                />
                <div>
                  <div className="font-semibold">{quote.handle}</div>
                  <div className="font-mono text-xs text-subtle">
                    {[quote.activity, quote.expression].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <blockquote className="mt-4 text-[15px] leading-relaxed">“{quote.text}”</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
