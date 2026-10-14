import { describe, expect, it } from "vitest";

import { DEFAULT_COLORS, EYES, SHAPES, createSpec } from "./spec.js";

describe("createSpec", () => {
  it("keeps the avatars generated before mouths and accessories existed", () => {
    expect(createSpec("Chief of Staff")).toMatchObject({
      background: "#264653",
      body: "#E76F51",
      eyeColor: "#FFFFFF",
      eyes: "round",
      offsetX: 1,
      offsetY: 1,
      rotate: 2,
      shape: "circle",
    });
    expect(createSpec("Research")).toMatchObject({
      background: "#2A9D8F",
      body: "#264653",
      eyes: "dot",
      offsetX: 5,
      offsetY: 1,
      rotate: 4,
      shape: "drop",
    });
    expect(createSpec("Inbox Assistant")).toMatchObject({
      background: "#E9C46A",
      body: "#E76F51",
      eyes: "round",
      offsetX: -1,
      offsetY: 4,
      rotate: 0,
      shape: "squircle",
    });
  });

  it("leaves mouth and accessory off unless asked", () => {
    for (let index = 0; index < 50; index += 1) {
      expect(createSpec(`agent-${index}`)).toMatchObject({ accessory: "none", mouth: "none" });
    }
  });

  it("gives each name its own blink rhythm and phase", () => {
    const specs = Array.from({ length: 50 }, (_, index) => createSpec(`agent-${index}`));
    for (const spec of specs) {
      expect(spec.blinkDuration).toBeGreaterThanOrEqual(5);
      expect(spec.blinkDuration).toBeLessThanOrEqual(9);
      expect(spec.blinkDelay).toBeLessThanOrEqual(0);
      expect(spec.blinkDelay).toBeGreaterThan(-spec.blinkDuration);
    }
    expect(new Set(specs.map((spec) => spec.blinkDuration)).size).toBeGreaterThan(20);
    expect(new Set(specs.map((spec) => spec.blinkDelay)).size).toBeGreaterThan(20);
  });

  it("varies tempo and phase slightly per name without moving the blink", () => {
    const specs = Array.from({ length: 50 }, (_, index) => createSpec(`agent-${index}`));
    for (const spec of specs) {
      expect(spec.tempo).toBeGreaterThanOrEqual(0.85);
      expect(spec.tempo).toBeLessThanOrEqual(1.15);
      expect(spec.phase).toBeGreaterThanOrEqual(0);
      expect(spec.phase).toBeLessThan(1);
    }
    expect(new Set(specs.map((spec) => spec.tempo)).size).toBeGreaterThan(15);
    expect(createSpec("Research")).toMatchObject({ blinkDelay: -3.1, blinkDuration: 7.8 });
  });

  it("picks an accent that differs from body and background", () => {
    for (let index = 0; index < 50; index += 1) {
      const spec = createSpec(`agent-${index}`);
      expect(spec.accent).not.toBe(spec.body);
      expect(spec.accent).not.toBe(spec.background);
    }
  });

  it("lets explicit colors, mouth and accessory win and recomputes eye contrast", () => {
    expect(
      createSpec("x", { accessory: "hat", background: "#000000", body: "#FFFFFF", mouth: "open" }),
    ).toMatchObject({
      accessory: "hat",
      background: "#000000",
      body: "#FFFFFF",
      eyeColor: "#141414",
      mouth: "open",
    });
  });

  it("returns the same spec for the same name", () => {
    expect(createSpec("Research Agent")).toEqual(createSpec("Research Agent"));
  });

  it("varies across names", () => {
    const specs = Array.from({ length: 40 }, (_, index) => createSpec(`agent-${index}`));
    expect(new Set(specs.map((spec) => spec.shape)).size).toBeGreaterThan(4);
    expect(new Set(specs.map((spec) => spec.eyes)).size).toBe(EYES.length);
  });

  it("draws body and background from the palette as two different colors", () => {
    const colors = ["#111111", "#eeeeee", "#ff0000"];
    for (let index = 0; index < 30; index += 1) {
      const spec = createSpec(`agent-${index}`, { colors });
      expect(colors).toContain(spec.background);
      expect(colors).toContain(spec.body);
      expect(spec.body).not.toBe(spec.background);
    }
  });

  it("falls back to the default palette when colors are empty", () => {
    expect(DEFAULT_COLORS).toContain(createSpec("x", { colors: [] }).body);
  });

  it("lets explicit shape and eyes win over the hash", () => {
    for (const shape of SHAPES) {
      expect(createSpec("anything", { shape, eyes: "dot" })).toMatchObject({ shape, eyes: "dot" });
    }
  });

  it("picks dark eyes on light bodies and light eyes on dark bodies", () => {
    expect(createSpec("a", { colors: ["#fafafa", "#ffffff"] }).eyeColor).toBe("#141414");
    expect(createSpec("a", { colors: ["#101010", "#000000"] }).eyeColor).toBe("#FFFFFF");
  });

  it("keeps placement jitter within bounds", () => {
    for (let index = 0; index < 100; index += 1) {
      const spec = createSpec(`agent-${index}`);
      expect(Math.abs(spec.offsetX)).toBeLessThanOrEqual(6);
      expect(Math.abs(spec.offsetY)).toBeLessThanOrEqual(5);
      expect(Math.abs(spec.rotate)).toBeLessThanOrEqual(12);
    }
  });
});
