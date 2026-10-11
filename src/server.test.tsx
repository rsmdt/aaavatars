import { describe, expect, it } from "vitest";

import { renderAvatarSvg } from "./server.js";

describe("renderAvatarSvg", () => {
  it("returns standalone svg markup", () => {
    const markup = renderAvatarSvg({ name: "Chief of Staff", size: 48 });
    expect(markup.startsWith("<svg")).toBe(true);
    expect(markup).toContain("<path");
    expect(markup).toContain('width="48"');
  });

  it("is deterministic for the same name", () => {
    expect(renderAvatarSvg({ name: "Research" })).toBe(renderAvatarSvg({ name: "Research" }));
  });
});
