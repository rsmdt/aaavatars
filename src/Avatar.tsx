import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  type AvatarEvent,
  EVENT_ANIMATIONS,
  type EventAnimation,
  type LidFrame,
  MOOD_SWAP_REST,
  MOOD_SWAP_SHOW,
  PREP_MS,
  SLEEP_ANIMATION,
  STUCK_ANIMATION,
  WAKE_ANIMATION,
  stage,
} from "./animations.js";
import { SHAPE_GEOMETRY } from "./geometry.js";
import {
  AccessoryShape,
  EyePair,
  type EyePose,
  MoodMouths,
  MouthShape,
  type RenderMouth,
  mouthSlot,
} from "./parts.js";
import {
  type Accessory,
  type Eyes,
  type Fill,
  type Mouth,
  type Shape,
  createSpec,
  shadeHex,
} from "./spec.js";
import { restartGazeCentred, watchPointer } from "./pointer.js";
import { AVATAR_CSS } from "./styles.js";
import { watchVisibility } from "./visibility.js";

export const ACTIVITIES = [
  "idle",
  "thinking",
  "working",
  "reading",
  "searching",
  "reviewing",
  "coding",
  "writing",
  "waiting",
  "asking",
  "listening",
  "speaking",
  "stuck",
  "sleeping",
] as const;

export const EXPRESSIONS = [
  "neutral",
  "happy",
  "sad",
  "angry",
  "confused",
  "curious",
  "tired",
  "love",
] as const;

export const GAZES = ["follow", "ponder", "scan", "read", "wander", "ahead", "down", "away"] as const;

export type Activity = (typeof ACTIVITIES)[number];
export type Expression = (typeof EXPRESSIONS)[number];
export type Gaze = (typeof GAZES)[number];

const ACTIVITY_GAZE: Record<Activity, Gaze> = {
  idle: "follow",
  thinking: "ponder",
  working: "scan",
  reading: "read",
  searching: "ahead",
  reviewing: "ahead",
  coding: "ahead",
  writing: "read",
  waiting: "ahead",
  asking: "ahead",
  listening: "ahead",
  speaking: "follow",
  stuck: "ahead",
  sleeping: "ahead",
};

export const EVENT_LAYERS: Record<AvatarEvent, { expression: Expression; gaze: Gaze }> = {
  acknowledge: { expression: "neutral", gaze: "ahead" },
  handoff: { expression: "neutral", gaze: "ahead" },
  success: { expression: "happy", gaze: "ahead" },
  warning: { expression: "neutral", gaze: "ahead" },
  error: { expression: "neutral", gaze: "ahead" },
  surprised: { expression: "neutral", gaze: "ahead" },
  sigh: { expression: "tired", gaze: "ahead" },
  yawn: { expression: "tired", gaze: "ahead" },
};

const ACTIVITY_POSE: Partial<Record<Activity, EyePose>> = {
  coding: "prompt",
  stuck: "cross",
  listening: "cursor",
};

export type AvatarContent = "face" | "initial";

export interface AvatarHandle {
  play: (event: AvatarEvent) => Promise<void>;
}

export interface AvatarProps {
  accessory?: Accessory;
  activity?: Activity;
  background?: string;
  badge?: ReactNode;
  blink?: boolean;
  body?: string;
  className?: string;
  colors?: readonly string[];
  content?: AvatarContent;
  expression?: Expression;
  eyes?: Eyes;
  fill?: Fill;
  frame?: number;
  gaze?: Gaze;
  interactive?: boolean;
  label?: string;
  loop?: boolean;
  mouth?: Mouth;
  name: string;
  onChange?: (event: AvatarEvent | null) => void;
  renderMouth?: RenderMouth;
  shading?: number;
  shape?: Shape;
  size?: number;
  src?: string;
}

const DRAG_THRESHOLD = 3;
const HOLD_MS = 600;
const SQUISH_LIMIT = 40;

interface DragState {
  held: boolean;
  holdTimer: ReturnType<typeof setTimeout> | undefined;
  moved: boolean;
  x: number;
  y: number;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function lidPairs(root: SVGSVGElement | null, lids: LidFrame[] | undefined): [Element, Keyframe[]][] {
  if (!root || !lids) return [];
  return [...root.querySelectorAll<SVGRectElement>(".aaa-lid")].map((lid) => {
    const half = Number(lid.dataset.h);
    const top = lid.classList.contains("aaa-lid-top");
    const side = lid.classList.contains("aaa-lid-l") ? -1 : 1;
    return [
      lid,
      lids.map(({ bottom, easing, offset, tilt = 0, top: drop }) => {
        if (bottom === undefined && drop === undefined) return { offset, ...(easing && { easing }) };
        const transform = top
          ? `translateY(${((drop ?? 0) * half).toFixed(2)}px) rotate(${side * tilt}deg)`
          : `translateY(${(-(bottom ?? 0) * half).toFixed(2)}px)`;
        return { offset, transform, ...(easing && { easing }) };
      }),
    ];
  });
}

function eyePairs(root: SVGSVGElement | null, animation: EventAnimation): [Element, Keyframe[]][] {
  const frames = animation.eye;
  if (!root || !frames) return [];
  return [...root.querySelectorAll<SVGGElement>(".aaa-eye")].map((eye) => [
    eye,
    frames(eye.classList.contains("aaa-eye-l") ? -1 : 1, {
      gap: Number(eye.dataset.gap),
      h: Number(eye.dataset.h),
      w: Number(eye.dataset.w),
    }),
  ]);
}

function heldValues(element: Element, frames: Keyframe[]): Keyframe {
  const style = getComputedStyle(element);
  const properties = new Set(
    frames.flatMap((frame) =>
      Object.keys(frame).filter((key) => !["offset", "easing", "composite", "transform"].includes(key)),
    ),
  );
  return Object.fromEntries(
    [...properties].map((property) => [property, style.getPropertyValue(property)]),
  );
}

function clampFrame(frame: number): number {
  return Math.min(Math.max(frame, 0), 0.5);
}

export function frameRadius(frame: number | undefined): string | undefined {
  if (frame === undefined) return undefined;
  return `${clampFrame(frame) * 100}%`;
}

export const Avatar = forwardRef<AvatarHandle, AvatarProps>(function Avatar(
  {
    accessory,
    activity = "idle",
    background,
    badge,
    blink = false,
    body,
    className,
    colors,
    content = "face",
    expression = "neutral",
    eyes,
    fill = "solid",
    frame,
    gaze,
    interactive = false,
    label,
    loop = false,
    mouth,
    name,
    onChange,
    renderMouth,
    shading = 0,
    shape,
    size = 64,
    src,
  },
  ref,
) {
  const uid = `aaa-${useId().replace(/[^a-zA-Z0-9-_]/g, "")}`;
  const svgRef = useRef<SVGSVGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const squishRef = useRef<SVGGElement>(null);
  const running = useRef<Animation[]>([]);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [reacting, setReacting] = useState<EyePose | null>(null);
  const latestOnChange = useRef(onChange);
  latestOnChange.current = onChange;
  const latestPlay = useRef(0);

  useEffect(() => setImageFailed(false), [src]);

  const spec = useMemo(
    () => createSpec(name, { accessory, background, body, colors, eyes, mouth, shape }),
    [name, accessory, background, body, colors, eyes, mouth, shape],
  );
  const geometry = SHAPE_GEOMETRY[spec.shape];
  const framed = frame !== undefined;
  const radius = framed ? clampFrame(frame) * 100 : 0;
  const showImage = Boolean(src) && !imageFailed;
  const hasMouth = content === "face" && (Boolean(renderMouth) || spec.mouth !== "none");
  const accessoryBehind = spec.accessory === "antenna" || spec.accessory === "sprout";
  const resolvedGaze = gaze ?? ACTIVITY_GAZE[activity];
  const shownExpression = activity === "sleeping" ? "neutral" : expression;
  const pose =
    reacting ?? (shownExpression === "neutral" ? (ACTIVITY_POSE[activity] ?? "eye") : "eye");
  const tracksPointer = resolvedGaze === "follow" && !showImage;
  const slot = mouthSlot(geometry, spec.eyeColor);
  const bodyFill = fill === "gradient" ? `url(#${uid}-fill)` : spec.body;
  const clay = shading > 0;
  const sheenY = geometry.top + (geometry.bottom - geometry.top) * 0.26;
  const placement = framed
    ? `translate(${50 + spec.offsetX} ${50 + spec.offsetY}) rotate(${spec.rotate}) scale(0.78) translate(-50 -50)`
    : "translate(50 50) scale(0.92) translate(-50 -50)";

  const run = useCallback((name: string, animation: EventAnimation, immediate = false) => {
    for (const animation of running.current) animation.cancel();
    const target = bodyRef.current;
    const eyePair = eyesRef.current;
    if (
      !target ||
      typeof target.animate !== "function" ||
      document.hidden ||
      prefersReducedMotion()
    ) {
      return Promise.resolve();
    }
    const prep = immediate ? 0 : (animation.prep ?? PREP_MS);
    const timing = { duration: prep + animation.duration, easing: "linear" };
    const root = svgRef.current;
    const rest = root?.querySelector<SVGGElement>(".aaa-mouth-rest");
    const accessory = root?.querySelector<SVGGElement>(".aaa-accessory");
    const accessoryName = accessory?.dataset.accessory as keyof NonNullable<
      typeof animation.accessory
    >;
    const accessoryFrames = accessoryName ? animation.accessory?.[accessoryName] : undefined;
    const mood = animation.mood
      ? root?.querySelector<SVGGElement>(`.aaa-mood-${animation.mood.name}`)
      : undefined;
    const pairs: [Element | null | undefined, Keyframe[] | undefined][] = [
      [target, animation.body],
      [eyePair, animation.eyes],
      [rest, animation.mood ? (animation.mood.rest ?? MOOD_SWAP_REST) : animation.mouth],
      [mood, animation.mood ? (animation.mood.frames ?? MOOD_SWAP_SHOW) : undefined],
      [accessory, accessoryFrames],
      ...lidPairs(root, animation.lids),
      ...eyePairs(root, animation),
    ];
    const started = pairs.flatMap(([element, frames]) =>
      element && frames?.length
        ? [element.animate(stage(frames, animation.duration, prep, heldValues(element, frames)), timing)]
        : [],
    );
    running.current = started;
    root?.setAttribute("data-reacting", name);
    setReacting(animation.pose ?? "eye");
    return Promise.all(started.map((animation) => animation.finished)).then(
      () => undefined,
      () => undefined,
    ).then(() => {
      if (running.current !== started || !root) return;
      restartGazeCentred(root);
      root.removeAttribute("data-reacting");
      setReacting(null);
    });
  }, []);

  const play = useCallback(
    async (event: AvatarEvent, immediate = false) => {
      const id = ++latestPlay.current;
      latestOnChange.current?.(event);
      await run(event, EVENT_ANIMATIONS[event], immediate);
      if (id === latestPlay.current) latestOnChange.current?.(null);
    },
    [run],
  );

  useImperativeHandle(ref, () => ({ play: (event: AvatarEvent) => play(event) }), [play]);

  const previousActivity = useRef(activity);

  useEffect(() => {
    const previous = previousActivity.current;
    previousActivity.current = activity;
    if (previous === activity) return;
    if (activity === "sleeping") void run("sleep", SLEEP_ANIMATION);
    else if (previous === "sleeping") void run("wake", WAKE_ANIMATION);
    else if (activity === "stuck") void run("stuck", STUCK_ANIMATION);
  }, [activity, play, run]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return watchVisibility(svg);
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!tracksPointer || !svg || prefersReducedMotion()) return;
    return watchPointer(svg);
  }, [tracksPointer]);

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const state: DragState = {
      held: false,
      holdTimer: undefined,
      moved: false,
      x: event.clientX,
      y: event.clientY,
    };
    state.holdTimer = setTimeout(() => {
      state.held = true;
      void play("success", true);
    }, HOLD_MS);
    drag.current = state;
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const state = drag.current;
    const squish = squishRef.current;
    if (!state || !squish) return;
    const unitsPerPixel = 100 / event.currentTarget.getBoundingClientRect().width;
    const dx = (event.clientX - state.x) * unitsPerPixel;
    const dy = (event.clientY - state.y) * unitsPerPixel;
    if (!state.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    state.moved = true;
    clearTimeout(state.holdTimer);
    const clampedX = Math.max(-SQUISH_LIMIT, Math.min(SQUISH_LIMIT, dx));
    const clampedY = Math.max(-SQUISH_LIMIT, Math.min(SQUISH_LIMIT, dy));
    const stretchX = 1 + Math.abs(clampedX) / 100 - Math.abs(clampedY) / 250;
    const stretchY = 1 + Math.abs(clampedY) / 100 - Math.abs(clampedX) / 250;
    squish.setAttribute("data-dragging", "");
    squish.style.transform = `translate(${clampedX * 0.3}px, ${clampedY * 0.3}px) scale(${stretchX}, ${stretchY})`;
  }

  function endDrag() {
    const state = drag.current;
    drag.current = null;
    if (!state) return;
    clearTimeout(state.holdTimer);
    suppressClick.current = state.moved || state.held;
    const squish = squishRef.current;
    if (squish) {
      squish.removeAttribute("data-dragging");
      squish.style.transform = "";
    }
  }

  function handleClick(event: MouseEvent<SVGSVGElement>) {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    void play(event.detail > 1 ? "surprised" : "acknowledge", true);
  }

  const svg = (
    <svg
      ref={svgRef}
      aria-label={label ? `${name}, ${label}` : name}
      className={className && !badge ? `aaa ${className}` : "aaa"}
      data-activity={activity}
      data-blink={blink ? undefined : "off"}
      data-expression={shownExpression}
      data-gaze={resolvedGaze}
      data-interactive={interactive ? "" : undefined}
      data-loop={loop ? undefined : "off"}
      height={size}
      overflow={framed ? undefined : "visible"}
      role="img"
      style={
        {
          "--aaa-gap": geometry.eyeGap,
          "--aaa-phase": spec.phase,
          "--aaa-tempo": spec.tempo,
        } as CSSProperties
      }
      viewBox="0 0 100 100"
      width={size}
      onClick={interactive ? handleClick : undefined}
      onPointerCancel={interactive ? endDrag : undefined}
      onPointerDown={interactive ? startDrag : undefined}
      onPointerMove={interactive ? moveDrag : undefined}
      onPointerUp={interactive ? endDrag : undefined}
    >
      {label ? <title>{label}</title> : null}
      <style>{AVATAR_CSS}</style>
      <defs>
        {framed ? (
          <clipPath id={`${uid}-frame`}>
            <rect width={100} height={100} rx={radius} />
          </clipPath>
        ) : null}
        {fill === "gradient" ? (
          <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={shadeHex(spec.body, 0.18)} />
            <stop offset="100%" stopColor={shadeHex(spec.body, -0.22)} />
          </linearGradient>
        ) : null}
        {clay ? (
          <>
            <clipPath id={`${uid}-body`}>
              <path d={geometry.path} />
            </clipPath>
            <mask id={`${uid}-outside`} maskUnits="userSpaceOnUse" x={-20} y={-20} width={140} height={140}>
              <rect x={-20} y={-20} width={140} height={140} fill="#fff" />
              <path d={geometry.path} fill="#000" />
            </mask>
            <radialGradient id={`${uid}-rim`} cx="0.5" cy="0.5" fx="0.42" fy="0.36" r="0.5">
              <stop offset="45%" stopColor="#000000" stopOpacity={0} />
              <stop offset="80%" stopColor="#000000" stopOpacity={0.1 * shading} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0.3 * shading} />
            </radialGradient>
            <radialGradient id={`${uid}-sheen`}>
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6 * shading} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </radialGradient>
            <radialGradient id={`${uid}-shadow`}>
              <stop offset="0%" stopColor="#000000" stopOpacity={0.3 * shading} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </radialGradient>
          </>
        ) : null}
      </defs>
      {framed ? (
        <rect data-frame="" width={100} height={100} rx={radius} fill={spec.background} />
      ) : null}
      <g clipPath={framed ? `url(#${uid}-frame)` : undefined}>
        {showImage ? (
          <g ref={bodyRef} className="aaa-react">
            <image
              data-image=""
              height={100}
              href={src}
              preserveAspectRatio="xMidYMid slice"
              width={100}
              onError={() => setImageFailed(true)}
            />
          </g>
        ) : (
          <g transform={placement}>
            <g ref={squishRef} className="aaa-squish">
              <g className="aaa-head">
                {clay ? (
                  <ellipse
                    className="aaa-shadow"
                    cx={50}
                    cy={geometry.bottom + 5}
                    fill={`url(#${uid}-shadow)`}
                    rx={30}
                    ry={5}
                  />
                ) : null}
                <g className="aaa-body-motion">
                  <g ref={bodyRef} className="aaa-react">
                    {accessoryBehind ? (
                      <AccessoryShape
                        accent={spec.accent}
                        accessory={spec.accessory}
                        body={spec.body}
                        geometry={geometry}
                      />
                    ) : null}
                    <path
                      d={geometry.path}
                      fill={bodyFill}
                      stroke={bodyFill}
                      strokeLinejoin="round"
                      strokeWidth={8}
                    />
                    {clay ? (
                      <>
                        <g className="aaa-rim">
                          <path d={geometry.path} fill={`url(#${uid}-rim)`} />
                          <path
                            d={geometry.path}
                            fill="none"
                            mask={`url(#${uid}-outside)`}
                            stroke="#000000"
                            strokeLinejoin="round"
                            strokeOpacity={0.3 * shading}
                            strokeWidth={8}
                          />
                        </g>
                        <g clipPath={`url(#${uid}-body)`}>
                          <g className="aaa-look">
                            <g className="aaa-gaze">
                              <ellipse
                                className="aaa-sheen"
                                cx={39}
                                cy={sheenY}
                                fill={`url(#${uid}-sheen)`}
                                rx={17}
                                ry={11}
                                transform={`rotate(-24 39 ${sheenY})`}
                              />
                            </g>
                          </g>
                        </g>
                      </>
                    ) : null}
                    <g ref={eyesRef} className="aaa-eyes-react" fill={spec.eyeColor}>
                      <g className="aaa-look">
                        {content === "initial" ? (
                          <text
                            dominantBaseline="central"
                            fontFamily="system-ui, sans-serif"
                            fontSize={38}
                            fontWeight={700}
                            textAnchor="middle"
                            x={50}
                            y={(geometry.top + geometry.bottom) / 2 + 2}
                          >
                            {name.trim().charAt(0).toUpperCase()}
                          </text>
                        ) : (
                          <g className="aaa-gaze">
                            <g className="aaa-eyes-motion">
                              <g
                                className="aaa-blink"
                                style={{
                                  animationDelay: `${spec.blinkDelay}s`,
                                  animationDuration: `${spec.blinkDuration * 2}s`,
                                }}
                              >
                                <EyePair
                                  eyes={spec.eyes}
                                  gap={geometry.eyeGap}
                                  id={uid}
                                  pose={pose}
                                  y={geometry.eyeY}
                                />
                              </g>
                            </g>
                          </g>
                        )}
                      </g>
                    </g>
                    {hasMouth ? (
                      <g className="aaa-look">
                        <g className="aaa-mouth-rest">
                          {renderMouth ? (
                            renderMouth(slot)
                          ) : (
                            <MouthShape mouth={spec.mouth} slot={slot} />
                          )}
                        </g>
                        <MoodMouths slot={slot} />
                      </g>
                    ) : null}
                    {!accessoryBehind && (spec.accessory !== "glasses" || content === "face") ? (
                      <AccessoryShape
                        accent={spec.accent}
                        accessory={spec.accessory}
                        body={spec.body}
                        geometry={geometry}
                      />
                    ) : null}
                  </g>
                </g>
              </g>
            </g>
          </g>
        )}
      </g>
    </svg>
  );

  if (!badge) return svg;

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        height: size,
        lineHeight: 0,
        position: "relative",
        width: size,
      }}
    >
      {svg}
      <span
        data-badge=""
        style={{ bottom: 0, position: "absolute", right: 0, transform: "translate(20%, 20%)" }}
      >
        {badge}
      </span>
    </span>
  );
});
