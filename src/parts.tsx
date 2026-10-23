import type { CSSProperties, ReactNode } from "react";

import type { ShapeGeometry } from "./geometry.js";
import type { Accessory, Eyes, Mouth } from "./spec.js";

export interface MouthSlot {
  color: string;
  width: number;
  x: number;
  y: number;
}

export type RenderMouth = (mouth: MouthSlot) => ReactNode;

const STROKE = { fill: "none", strokeLinecap: "round", strokeWidth: 4 } as const;

export function mouthSlot(geometry: ShapeGeometry, color: string): MouthSlot {
  return { color, width: geometry.eyeGap * 1.2, x: 50, y: geometry.eyeY + 17 };
}

const EYE_HALF_HEIGHT: Record<Eyes, number> = { dot: 7, round: 10, tall: 11, wide: 7 };

const EYE_HALF_WIDTH: Record<Eyes, number> = { dot: 7, round: 8, tall: 5, wide: 11 };

export type EyePose = "eye" | "prompt" | "cross" | "smile";

type Point = [x: number, y: number];

type Segment = [control1: Point, control2: Point, end: Point];

const SEGMENTS = 12;

const CROSS: Point[] = [
  [0, -3.5],
  [5, -8.5],
  [8.5, -5],
  [3.5, 0],
  [8.5, 5],
  [5, 8.5],
  [0, 3.5],
  [-5, 8.5],
  [-8.5, 5],
  [-3.5, 0],
  [-8.5, -5],
  [-5, -8.5],
];

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number): Segment {
  const k = (4 / 3) * Math.tan((to - from) / 4);
  const point = (angle: number): Point => [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  const tangent = (angle: number): Point => [-rx * Math.sin(angle), ry * Math.cos(angle)];
  const [x0, y0] = point(from);
  const [x1, y1] = point(to);
  const [tx0, ty0] = tangent(from);
  const [tx1, ty1] = tangent(to);
  return [
    [x0 + k * tx0, y0 + k * ty0],
    [x1 - k * tx1, y1 - k * ty1],
    [x1, y1],
  ];
}

function line([x0, y0]: Point, [x1, y1]: Point): Segment {
  return [
    [x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3],
    [x0 + ((x1 - x0) * 2) / 3, y0 + ((y1 - y0) * 2) / 3],
    [x1, y1],
  ];
}

function toPath(start: Point, segments: Segment[]): string {
  const at = ([x, y]: Point) => `${+x.toFixed(2)} ${+y.toFixed(2)}`;
  return `M${at(start)}${segments.map((segment) => `C${segment.map(at).join(" ")}`).join("")}Z`;
}

const DEG = Math.PI / 180;

function ellipse(rx: number, ry: number): string {
  const step = (2 * Math.PI) / SEGMENTS;
  return toPath(
    [0, -ry],
    Array.from({ length: SEGMENTS }, (_, index) => arc(0, 0, rx, ry, -90 * DEG + index * step, -90 * DEG + (index + 1) * step)),
  );
}

function stadium(r: number, half: number): string {
  const top = r - half;
  const bottom = half - r;
  return toPath(
    [0, -half],
    [
      arc(0, top, r, r, 270 * DEG, 315 * DEG),
      arc(0, top, r, r, 315 * DEG, 360 * DEG),
      line([r, top], [r, 0]),
      line([r, 0], [r, bottom]),
      ...[0, 45, 90, 135].map((from) => arc(0, bottom, r, r, from * DEG, (from + 45) * DEG)),
      line([-r, bottom], [-r, 0]),
      line([-r, 0], [-r, top]),
      arc(0, top, r, r, 180 * DEG, 225 * DEG),
      arc(0, top, r, r, 225 * DEG, 270 * DEG),
    ],
  );
}

function smileArc(rx: number, ry: number, thickness: number, dy: number): string {
  const half = thickness / 2;
  const quarters = (cx: number, r: number, rY: number, from: number, to: number) =>
    [0, 1].map((index) => arc(cx, dy, r, rY, (from + ((to - from) * index) / 2) * DEG, (from + ((to - from) * (index + 1)) / 2) * DEG));
  return toPath(
    [0, dy - ry - half],
    [
      ...quarters(0, rx + half, ry + half, -90, 0),
      ...quarters(rx, half, half, 0, 180),
      ...quarters(0, rx - half, ry - half, 0, -90),
      ...quarters(0, rx - half, ry - half, -90, -180),
      ...quarters(-rx, half, half, 0, 180),
      ...quarters(0, rx + half, ry + half, 180, 270),
    ],
  );
}

function polygon(vertices: Point[], dx = 0): string {
  const shifted = vertices.map(([x, y]): Point => [x + dx, y]);
  const edges = shifted.map((from, index) => ({ from, to: shifted[(index + 1) % shifted.length]!, parts: 1 }));
  for (let count = edges.length; count < SEGMENTS; count += 1) {
    const longest = edges.reduce((best, edge) =>
      Math.hypot(edge.to[0] - edge.from[0], edge.to[1] - edge.from[1]) / edge.parts >
      Math.hypot(best.to[0] - best.from[0], best.to[1] - best.from[1]) / best.parts
        ? edge
        : best,
    );
    longest.parts += 1;
  }
  const anchors = edges.flatMap(({ from, to, parts }) =>
    Array.from({ length: parts }, (_, index): Point => [
      from[0] + ((to[0] - from[0]) * index) / parts,
      from[1] + ((to[1] - from[1]) * index) / parts,
    ]),
  );
  const cx = shifted.reduce((sum, [x]) => sum + x, 0) / shifted.length;
  const cy = shifted.reduce((sum, [, y]) => sum + y, 0) / shifted.length;
  const offTop = ([x, y]: Point) => Math.abs(Math.atan2(x - cx, cy - y));
  const first = anchors.reduce((best, anchor, index) => (offTop(anchor) < offTop(anchors[best]!) ? index : best), 0);
  const ordered = [...anchors.slice(first), ...anchors.slice(0, first)];
  return toPath(
    ordered[0]!,
    ordered.map((anchor, index) => line(anchor, ordered[(index + 1) % ordered.length]!)),
  );
}

export function eyePath(eyes: Eyes, pose: EyePose, side: -1 | 1, gap: number): string {
  if (pose === "cross") return polygon(CROSS);
  if (pose === "smile") return smileArc(7, 7.5, 6.5, 3.5);
  if (pose === "prompt" && side === -1) {
    return polygon([[-8, -14], [0, -14], [10, 0], [0, 14], [-8, 14], [2, 0]], gap - 11.5);
  }
  if (pose === "prompt") return polygon([[-9, 8.5], [9, 8.5], [9, 14], [-9, 14]], 10.5 - gap);
  if (eyes === "tall") return stadium(5, 11);
  return ellipse(EYE_HALF_WIDTH[eyes], EYE_HALF_HEIGHT[eyes]);
}

function LidMask({ eyes, id, side }: { eyes: Eyes; id: string; side: "l" | "r" }) {
  const half = EYE_HALF_HEIGHT[eyes];
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={-20} y={-20} width={40} height={40}>
      <rect x={-20} y={-20} width={40} height={40} fill="#fff" />
      <rect
        className={`aaa-lid aaa-lid-top aaa-lid-${side}`}
        data-h={half}
        x={-20}
        y={-half - 20}
        width={40}
        height={20}
        fill="#000"
      />
      <rect
        className={`aaa-lid aaa-lid-bottom aaa-lid-${side}`}
        data-h={half}
        x={-20}
        y={half}
        width={40}
        height={20}
        fill="#000"
      />
    </mask>
  );
}

export function EyePair({
  eyes,
  gap,
  id,
  pose,
  y,
}: {
  eyes: Eyes;
  gap: number;
  id: string;
  pose: EyePose;
  y: number;
}) {
  const h = EYE_HALF_HEIGHT[eyes];
  const w = EYE_HALF_WIDTH[eyes];
  return (
    <>
      {(["l", "r"] as const).map((side) => (
        <g key={side} transform={`translate(${side === "l" ? 50 - gap : 50 + gap} ${y})`}>
          <g
            className={`aaa-eye aaa-eye-${side}`}
            data-gap={gap}
            data-h={h}
            data-shape={pose}
            data-w={w}
            style={{ "--aaa-eye-h": h, "--aaa-eye-w": w } as CSSProperties}
          >
            <LidMask eyes={eyes} id={`${id}-lid-${side}`} side={side} />
            <g mask={`url(#${id}-lid-${side})`}>
              <path className="aaa-shape" d={eyePath(eyes, pose, side === "l" ? -1 : 1, gap)} />
            </g>
          </g>
        </g>
      ))}
    </>
  );
}

export function MouthShape({ mouth, slot }: { mouth: Mouth; slot: MouthSlot }) {
  const half = slot.width / 2;
  if (mouth === "smile") {
    return (
      <path
        d={`M${slot.x - half} ${slot.y - 2}Q${slot.x} ${slot.y + 7} ${slot.x + half} ${slot.y - 2}`}
        stroke={slot.color}
        {...STROKE}
      />
    );
  }
  if (mouth === "flat") {
    return (
      <path
        d={`M${slot.x - half * 0.7} ${slot.y}H${slot.x + half * 0.7}`}
        stroke={slot.color}
        {...STROKE}
      />
    );
  }
  if (mouth === "open") {
    return <ellipse cx={slot.x} cy={slot.y} rx={half * 0.5} ry={5} fill={slot.color} />;
  }
  return null;
}

export const MOODS = ["happy", "sad", "o", "small", "flat"] as const;

export type Mood = (typeof MOODS)[number];

export function MoodMouths({ slot }: { slot: MouthSlot }) {
  const half = slot.width / 2;
  const { color, x, y } = slot;
  return (
    <>
      <g className="aaa-mood aaa-mood-happy">
        <path d={`M${x - half} ${y - 3}Q${x} ${y + 12} ${x + half} ${y - 3}Z`} fill={color} />
      </g>
      <g className="aaa-mood aaa-mood-sad">
        <path
          d={`M${x - half * 0.8} ${y + 4}Q${x} ${y - 5} ${x + half * 0.8} ${y + 4}`}
          stroke={color}
          {...STROKE}
        />
      </g>
      <g className="aaa-mood aaa-mood-o">
        <ellipse cx={x} cy={y + 1} rx={5} ry={6.5} fill={color} />
      </g>
      <g className="aaa-mood aaa-mood-small">
        <path d={`M${x + 1} ${y}H${x + 9}`} stroke={color} {...STROKE} />
      </g>
      <g className="aaa-mood aaa-mood-flat">
        <path d={`M${x - half * 0.5} ${y + 1}H${x + half * 0.5}`} stroke={color} {...STROKE} />
      </g>
    </>
  );
}

interface AccessoryProps {
  accent: string;
  accessory: Accessory;
  body: string;
  geometry: ShapeGeometry;
}

export function AccessoryShape(props: AccessoryProps) {
  if (props.accessory === "none") return null;
  return (
    <g className="aaa-accessory" data-accessory={props.accessory}>
      <AccessoryArt {...props} />
    </g>
  );
}

function AccessoryArt({ accessory, accent, body, geometry }: AccessoryProps) {
  const top = geometry.top - 4;
  const bottom = geometry.bottom;
  if (accessory === "antenna") {
    return (
      <g>
        <path d={`M50 ${top}V${top - 9}`} stroke={body} {...STROKE} strokeWidth={5} />
        <circle className="aaa-antenna-tip" cx={50} cy={top - 13} r={6} fill={accent} />
      </g>
    );
  }
  if (accessory === "sprout") {
    return (
      <g fill={accent}>
        <path d={`M50 ${top + 2}V${top - 10}`} stroke={accent} {...STROKE} />
        <ellipse cx={42} cy={top - 12} rx={9} ry={5} transform={`rotate(-30 42 ${top - 12})`} />
        <ellipse cx={58} cy={top - 14} rx={9} ry={5} transform={`rotate(25 58 ${top - 14})`} />
      </g>
    );
  }
  if (accessory === "hat") {
    return (
      <g fill={accent}>
        <rect x={32} y={top - 14} width={36} height={16} rx={5} />
        <rect x={24} y={top - 2} width={52} height={7} rx={3.5} />
      </g>
    );
  }
  if (accessory === "glasses") {
    const radius = 13;
    const left = 50 - geometry.eyeGap;
    const right = 50 + geometry.eyeGap;
    return (
      <g stroke={accent} fill="none" strokeWidth={3.5}>
        <circle cx={left} cy={geometry.eyeY} r={radius} />
        <circle cx={right} cy={geometry.eyeY} r={radius} />
        <path d={`M${left + radius} ${geometry.eyeY}H${right - radius}`} />
      </g>
    );
  }
  if (accessory === "bowtie") {
    const y = bottom - 6;
    return (
      <g fill={accent}>
        <path d={`M50 ${y}L37 ${y - 8}V${y + 8}Z`} />
        <path d={`M50 ${y}L63 ${y - 8}V${y + 8}Z`} />
        <circle cx={50} cy={y} r={4} />
      </g>
    );
  }
  return null;
}

export const GLYPHS = ["dots", "check", "bang", "question", "bars", "slide"] as const;

export type Glyph = (typeof GLYPHS)[number];

const DOTS = [-1, 0, 1];

const BARS: [offset: number, height: number][] = [
  [-1.5, 14],
  [-0.5, 28],
  [0.5, 20],
  [1.5, 10],
];

const GLYPH_STROKE = { fill: "none", strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function Glyphs({ fill }: { fill: string }) {
  return (
    <>
      <g className="aaa-glyph aaa-glyph-dots">
        {DOTS.map((offset) => (
          <g key={offset} className="aaa-dot" style={{ "--aaa-dot": offset } as CSSProperties}>
            <circle className="aaa-dot-pulse" cx={50 + offset * 20} cy={50} fill={fill} r={7} />
          </g>
        ))}
      </g>
      <g className="aaa-glyph aaa-glyph-check">
        <path d="M35 51L45.5 61.5L66 40" stroke={fill} strokeWidth={10} {...GLYPH_STROKE} />
      </g>
      <g className="aaa-glyph aaa-glyph-bang" fill={fill}>
        <rect x={45} y={29} width={10} height={28} rx={5} />
        <circle cx={50} cy={68} r={5.5} />
      </g>
      <g className="aaa-glyph aaa-glyph-question">
        <path
          d="M41 40A9.5 9.5 0 1 1 55 48.5C51.5 50.5 50 52.5 50 56"
          stroke={fill}
          strokeWidth={9}
          {...GLYPH_STROKE}
        />
        <circle cx={50} cy={68} fill={fill} r={5.5} />
      </g>
      <g className="aaa-glyph aaa-glyph-bars" fill={fill}>
        {BARS.map(([offset, height]) => (
          <rect
            key={offset}
            className="aaa-bar"
            height={height}
            rx={3.5}
            style={{ "--aaa-bar": offset } as CSSProperties}
            width={7}
            x={46.5 + offset * 11}
            y={50 - height / 2}
          />
        ))}
      </g>
      <g className="aaa-glyph aaa-glyph-slide">
        <circle cx={50} cy={50} fill={fill} r={8} />
      </g>
    </>
  );
}
