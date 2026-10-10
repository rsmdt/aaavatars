import type { ReactNode } from "react";

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

export function EyePair({ eyes, gap, y }: { eyes: Eyes; gap: number; y: number }) {
  return (
    <>
      {[50 - gap, 50 + gap].map((x) => {
        if (eyes === "dot") return <circle key={x} cx={x} cy={y} r={7} />;
        if (eyes === "tall") {
          return <rect key={x} x={x - 5} y={y - 11} width={10} height={22} rx={5} />;
        }
        if (eyes === "wide") return <ellipse key={x} cx={x} cy={y} rx={11} ry={7} />;
        return <ellipse key={x} cx={x} cy={y} rx={8} ry={10} />;
      })}
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

export const MOODS = ["happy", "sad", "o", "small"] as const;

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
