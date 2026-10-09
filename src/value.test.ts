import { describe, expect, it } from "vitest";

import { type AvatarValue, formatAvatarValue, parseAvatarValue } from "./value.js";

describe("avatar value", () => {
  it("round-trips every field", () => {
    const value: AvatarValue = {
      shape: "hex",
      eyes: "tall",
      mouth: "smile",
      accessory: "antenna",
      body: "#E76F51",
      background: "#264653",
      fill: "gradient",
    };
    const text = formatAvatarValue(value);
    expect(text).toBe(
      "shape=hex;eyes=tall;mouth=smile;accessory=antenna;body=#E76F51;background=#264653;fill=gradient",
    );
    expect(parseAvatarValue(text)).toEqual({ ok: true, value });
  });

  it("omits unset fields and accepts an empty value", () => {
    expect(formatAvatarValue({ shape: "pill" })).toBe("shape=pill");
    expect(parseAvatarValue("")).toEqual({ ok: true, value: {} });
    expect(parseAvatarValue(" shape = pill ; ")).toEqual({ ok: true, value: { shape: "pill" } });
  });

  it.each([
    ["shape=star", '"shape" must be one of'],
    ["body=red", '"body" must be a hex color'],
    ["body=#12345", '"body" must be a hex color'],
    ["background=url(x)", '"background" must be a hex color'],
    ["color=#fff", 'Unknown avatar field "color"'],
    ["shape", '"shape" must be one of'],
    ["shape=hex;shape=pill", '"shape" is set more than once'],
    [`shape=hex;${"x".repeat(200)}`, "longer than 200"],
  ])("rejects %s with a message naming the problem", (raw, message) => {
    const parsed = parseAvatarValue(raw);
    expect(parsed.ok).toBe(false);
    expect(parsed.ok ? "" : parsed.error).toContain(message);
  });
});
