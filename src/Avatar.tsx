import {
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
  MOOD_SWAP_REST,
  MOOD_SWAP_SHOW,
} from "./animations.js";
import { SHAPE_GEOMETRY } from "./geometry.js";
import {
  AccessoryShape,
  EyePair,
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
import { AVATAR_CSS } from "./styles.js";

export const AVATAR_STATUSES = [
  "idle",
  "thinking",
  "working",
  "waiting",
  "error",
  "sleeping",
] as const;

export type AvatarStatus = (typeof AVATAR_STATUSES)[number];

export type AvatarContent = "face" | "initial";

export interface AvatarHandle {
  play: (event: AvatarEvent) => Promise<void>;
}

export interface AvatarProps {
  accessory?: Accessory;
  background?: string;
  badge?: ReactNode;
  blink?: boolean;
  body?: string;
  className?: string;
  colors?: readonly string[];
  content?: AvatarContent;
  eyes?: Eyes;
  fill?: Fill;
  frame?: false | number;
  interactive?: boolean;
  label?: string;
  look?: boolean;
  motion?: boolean;
  mouth?: Mouth;
  name: string;
  renderMouth?: RenderMouth;
  shading?: number;
  shape?: Shape;
  size?: number;
  src?: string;
  status?: AvatarStatus;
}

const LOOK_RANGE = 4;
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

function clampFrame(frame: number): number {
  return Math.min(Math.max(frame, 0), 0.5);
}

export function frameRadius(frame: false | number | undefined): string | undefined {
  if (frame === false) return undefined;
  return `${clampFrame(frame ?? 0.5) * 100}%`;
}

export const Avatar = forwardRef<AvatarHandle, AvatarProps>(function Avatar(
  {
    accessory,
    background,
    badge,
    blink = true,
    body,
    className,
    colors,
    content = "face",
    eyes,
    fill = "solid",
    frame = 0.5,
    interactive = false,
    label,
    look = true,
    motion = true,
    mouth,
    name,
    renderMouth,
    shading = 0,
    shape,
    size = 64,
    src,
    status = "idle",
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

  useEffect(() => setImageFailed(false), [src]);

  const spec = useMemo(
    () => createSpec(name, { accessory, background, body, colors, eyes, mouth, shape }),
    [name, accessory, background, body, colors, eyes, mouth, shape],
  );
  const geometry = SHAPE_GEOMETRY[spec.shape];
  const framed = frame !== false;
  const radius = framed ? clampFrame(frame) * 100 : 0;
  const showImage = Boolean(src) && !imageFailed;
  const hasMouth = content === "face" && (Boolean(renderMouth) || spec.mouth !== "none");
  const accessoryBehind = spec.accessory === "antenna" || spec.accessory === "sprout";
  const tracksPointer = look && !showImage;
  const slot = mouthSlot(geometry, spec.eyeColor);
  const bodyFill = fill === "gradient" ? `url(#${uid}-fill)` : spec.body;
  const placement = framed
    ? `translate(${50 + spec.offsetX} ${50 + spec.offsetY}) rotate(${spec.rotate}) scale(0.78) translate(-50 -50)`
    : "translate(50 50) scale(0.92) translate(-50 -50)";

  const play = useCallback((event: AvatarEvent) => {
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
    const animation = EVENT_ANIMATIONS[event];
    const timing = { duration: animation.duration, easing: "ease-in-out" };
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
    ];
    running.current = pairs.flatMap(([element, frames]) =>
      element && frames ? [element.animate(frames, timing)] : [],
    );
    return Promise.all(running.current.map((animation) => animation.finished)).then(
      () => undefined,
      () => undefined,
    );
  }, []);

  useImperativeHandle(ref, () => ({ play }), [play]);

  function lookAt(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2 * LOOK_RANGE;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 * LOOK_RANGE;
    event.currentTarget.style.setProperty("--aaa-look-x", `${x}px`);
    event.currentTarget.style.setProperty("--aaa-look-y", `${y}px`);
  }

  function resetLook(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.style.removeProperty("--aaa-look-x");
    event.currentTarget.style.removeProperty("--aaa-look-y");
  }

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
      void play("success");
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
    void play(event.detail > 1 ? "surprise" : "acknowledge");
  }

  const svg = (
    <svg
      ref={svgRef}
      aria-label={label ? `${name}, ${label}` : name}
      className={className && !badge ? `aaa ${className}` : "aaa"}
      data-blink={blink ? undefined : "off"}
      data-interactive={interactive ? "" : undefined}
      data-motion={motion ? undefined : "off"}
      data-status={status}
      height={size}
      role="img"
      viewBox="0 0 100 100"
      width={size}
      onClick={interactive ? handleClick : undefined}
      onPointerCancel={interactive ? endDrag : undefined}
      onPointerDown={interactive ? startDrag : undefined}
      onPointerLeave={tracksPointer ? resetLook : undefined}
      onPointerMove={
        tracksPointer || interactive
          ? (event) => {
              if (tracksPointer) lookAt(event);
              if (interactive) moveDrag(event);
            }
          : undefined
      }
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
        {shading > 0 ? (
          <radialGradient id={`${uid}-shade`} cx="0.35" cy="0.3" r="0.85">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55 * shading} />
            <stop offset="45%" stopColor="#ffffff" stopOpacity={0} />
            <stop offset="100%" stopColor="#000000" stopOpacity={0.35 * shading} />
          </radialGradient>
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
                  {shading > 0 ? (
                    <path
                      d={geometry.path}
                      fill={`url(#${uid}-shade)`}
                      stroke={`url(#${uid}-shade)`}
                      strokeLinejoin="round"
                      strokeWidth={8}
                    />
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
                        <g className="aaa-eyes-motion">
                          <g className="aaa-blink">
                            <EyePair eyes={spec.eyes} gap={geometry.eyeGap} y={geometry.eyeY} />
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
