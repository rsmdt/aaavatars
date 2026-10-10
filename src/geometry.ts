import type { Shape } from "./spec.js";

export interface ShapeGeometry {
  bottom: number;
  eyeGap: number;
  eyeY: number;
  path: string;
  top: number;
}

export const SHAPE_GEOMETRY: Record<Shape, ShapeGeometry> = {
  circle: {
    path: "M50 10a40 40 0 1 0 0.01 0Z",
    eyeY: 46,
    eyeGap: 16,
    top: 10,
    bottom: 90,
  },
  squircle: {
    path: "M50 10C82 10 90 18 90 50C90 82 82 90 50 90C18 90 10 82 10 50C10 18 18 10 50 10Z",
    eyeY: 46,
    eyeGap: 17,
    top: 10,
    bottom: 90,
  },
  pill: {
    path: "M30 24H70A26 26 0 0 1 70 76H30A26 26 0 0 1 30 24Z",
    eyeY: 48,
    eyeGap: 17,
    top: 24,
    bottom: 76,
  },
  hex: {
    path: "M50 10L85 30V70L50 90L15 70V30Z",
    eyeY: 48,
    eyeGap: 16,
    top: 10,
    bottom: 90,
  },
  triangle: {
    path: "M50 14L89 84H11Z",
    eyeY: 62,
    eyeGap: 12,
    top: 14,
    bottom: 84,
  },
  drop: {
    path: "M50 8C50 8 84 44 84 63C84 82 69 92 50 92C31 92 16 82 16 63C16 44 50 8 50 8Z",
    eyeY: 62,
    eyeGap: 14,
    top: 8,
    bottom: 92,
  },
  cloud: {
    path: "M28 82C14 82 8 70 12 60C4 48 14 34 28 38C30 22 48 16 58 26C70 16 88 26 84 42C96 46 96 66 86 72C86 80 78 84 70 82Z",
    eyeY: 56,
    eyeGap: 16,
    top: 20,
    bottom: 82,
  },
  blob: {
    path: "M54 10C76 12 92 30 88 54C85 76 66 92 44 88C22 85 8 66 12 44C16 22 32 8 54 10Z",
    eyeY: 47,
    eyeGap: 16,
    top: 10,
    bottom: 89,
  },
};
