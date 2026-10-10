import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { AvatarGroup } from "./AvatarGroup.js";

afterEach(cleanup);

const members = ["Ada", "Bo", "Cy", "Di", "Ed", "Flo"].map((name) => ({ name }));

describe("AvatarGroup", () => {
  it("shows everyone when they fit", () => {
    const { container } = render(<AvatarGroup max={6} members={members} />);
    expect(container.querySelectorAll("svg")).toHaveLength(6);
    expect(container.querySelector("[data-overflow]")).toBeNull();
  });

  it("collapses the rest into a +N bubble within max slots", () => {
    const { container, getByRole } = render(<AvatarGroup max={4} members={members} />);
    expect(container.querySelectorAll("svg")).toHaveLength(3);
    expect(container.querySelector("[data-overflow]")?.textContent).toBe("+3");
    expect(getByRole("group").getAttribute("aria-label")).toBe("Ada, Bo, Cy and 3 more");
  });

  it("renders every member at the group size", () => {
    const { container } = render(<AvatarGroup members={members.slice(0, 2)} size={24} />);
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg.getAttribute("width")).toBe("24");
    }
  });
});
