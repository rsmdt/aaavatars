import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Avatar, type AvatarHandle } from "./Avatar.js";

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: reduced })),
  );
}

function stubAnimate() {
  const finishers: Array<() => void> = [];
  const animate = vi.fn(() => {
    let finish = () => {};
    const finished = new Promise<void>((resolve) => {
      finish = resolve;
    });
    finishers.push(finish);
    return { cancel: vi.fn(), finished } as unknown as Animation;
  });
  Object.defineProperty(SVGElement.prototype, "animate", { configurable: true, value: animate });
  return { animate, finishAll: () => finishers.forEach((finish) => finish()) };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (SVGElement.prototype as Partial<SVGElement>).animate;
});

describe("Avatar", () => {
  it("exposes the status for the CSS loops", () => {
    const { container, rerender } = render(<Avatar name="a" status="thinking" />);
    expect(container.querySelector("svg")?.dataset.status).toBe("thinking");
    rerender(<Avatar name="a" status="error" />);
    expect(container.querySelector("svg")?.dataset.status).toBe("error");
  });

  it("maps frame to the corner radius and clips the character to it", () => {
    const { container } = render(<Avatar frame={0.2} name="a" />);
    expect(container.querySelector("[data-frame]")?.getAttribute("rx")).toBe("20");
    expect(container.querySelector("clipPath rect")?.getAttribute("rx")).toBe("20");
  });

  it("clamps frame between square and circle", () => {
    const { container, rerender } = render(<Avatar frame={3} name="a" />);
    expect(container.querySelector("[data-frame]")?.getAttribute("rx")).toBe("50");
    rerender(<Avatar frame={-1} name="a" />);
    expect(container.querySelector("[data-frame]")?.getAttribute("rx")).toBe("0");
  });

  it("renders no background or clip without a frame", () => {
    const { container } = render(<Avatar frame={false} name="a" />);
    expect(container.querySelector("[data-frame]")).toBeNull();
    expect(container.querySelector("clipPath")).toBeNull();
  });

  it("play resolves after both body and eye animations finish", async () => {
    stubMatchMedia(false);
    const { animate, finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} accessory="none" mouth="none" name="a" />);

    let resolved = false;
    const playing = ref.current!.play("done").then(() => {
      resolved = true;
    });
    expect(animate).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    expect(resolved).toBe(false);

    await act(async () => {
      finishAll();
      await playing;
    });
    expect(resolved).toBe(true);
  });

  it("play cancels a running event before starting the next", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);

    void ref.current!.play("acknowledge");
    const first = animate.mock.results.map((result) => result.value as Animation);
    void ref.current!.play("handoff");
    for (const animation of first) expect(animation.cancel).toHaveBeenCalled();
  });

  it("play skips animation while the document is hidden", async () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);

    await expect(ref.current!.play("done")).resolves.toBeUndefined();
    expect(animate).not.toHaveBeenCalled();
  });

  it("play skips animation under reduced motion", async () => {
    stubMatchMedia(true);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);

    await expect(ref.current!.play("handoff")).resolves.toBeUndefined();
    expect(animate).not.toHaveBeenCalled();
  });

  it("shows the image and falls back to the character when it fails to load", () => {
    const { container } = render(<Avatar name="a" src="https://example.test/a.png" />);
    const image = container.querySelector("[data-image]");
    expect(image?.getAttribute("href")).toBe("https://example.test/a.png");
    expect(container.querySelector(".aaa-eyes-react")).toBeNull();

    fireEvent.error(image!);
    expect(container.querySelector("[data-image]")).toBeNull();
    expect(container.querySelector(".aaa-eyes-react")).not.toBeNull();
  });

  it("wraps the svg only when a badge is given and keeps the svg accessible", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    expect(container.firstElementChild?.tagName).toBe("svg");
    rerender(<Avatar badge={<b>1</b>} name="a" />);
    expect(container.firstElementChild?.tagName).toBe("SPAN");
    expect(container.querySelector("[data-badge]")?.textContent).toBe("1");
    expect(container.querySelector("svg")?.getAttribute("role")).toBe("img");
  });

  it("exposes the label as tooltip and accessible name", () => {
    const { container } = render(<Avatar label="Searching the web" name="Research" />);
    expect(container.querySelector("title")?.textContent).toBe("Searching the web");
    expect(container.querySelector("svg")?.getAttribute("aria-label")).toBe(
      "Research, Searching the web",
    );
  });

  it("switches blink and motion off through data attributes", () => {
    const { container } = render(<Avatar blink={false} motion={false} name="a" />);
    const svg = container.querySelector("svg")!;
    expect(svg.dataset.blink).toBe("off");
    expect(svg.dataset.motion).toBe("off");
  });

  it("follows the pointer only when look is on", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    const svg = () => container.querySelector("svg")!;
    fireEvent.pointerMove(svg(), { clientX: 10, clientY: 10 });
    expect(svg().style.getPropertyValue("--aaa-look-x")).not.toBe("");

    rerender(<Avatar look={false} name="b" />);
    svg().style.removeProperty("--aaa-look-x");
    fireEvent.pointerMove(svg(), { clientX: 10, clientY: 10 });
    expect(svg().style.getPropertyValue("--aaa-look-x")).toBe("");
  });

  it("reacts to clicks only when interactive", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const { container, rerender } = render(<Avatar name="a" />);
    fireEvent.click(container.querySelector("svg")!);
    expect(animate).not.toHaveBeenCalled();

    rerender(<Avatar interactive name="a" />);
    fireEvent.click(container.querySelector("svg")!);
    expect(animate).toHaveBeenCalled();
  });

  it("renders the initial instead of the face", () => {
    const { container } = render(<Avatar content="initial" name="research" />);
    expect(container.querySelector("text")?.textContent).toBe("R");
    expect(container.querySelector(".aaa-blink")).toBeNull();
  });

  it("hands the mouth slot to renderMouth", () => {
    const renderMouth = vi.fn(() => <circle data-custom-mouth="" />);
    const { container } = render(<Avatar name="a" renderMouth={renderMouth} />);
    expect(container.querySelector("[data-custom-mouth]")).not.toBeNull();
    expect(renderMouth).toHaveBeenCalledWith(
      expect.objectContaining({ x: 50, color: expect.any(String) }),
    );
  });

  it("draws gradient fill and shading when asked", () => {
    const { container } = render(<Avatar fill="gradient" name="a" shading={0.6} />);
    expect(container.querySelector("linearGradient")).not.toBeNull();
    expect(container.querySelector("radialGradient")).not.toBeNull();
  });

  it("draws no accessory and no mouth when they are omitted", () => {
    for (const name of ["a", "b", "Research", "Inbox Assistant", "Chief of Staff"]) {
      const { container, unmount } = render(<Avatar name={name} />);
      expect(container.querySelector(".aaa-accessory")).toBeNull();
      expect(container.querySelector(".aaa-mouth-rest")).toBeNull();
      unmount();
    }
  });

  it("blinks on a per-name rhythm with a staggered start", () => {
    const { container, rerender } = render(<Avatar name="Research" />);
    const blink = () => container.querySelector<SVGGElement>(".aaa-blink")!;
    const first = [blink().style.animationDuration, blink().style.animationDelay];
    expect(first[0]).toMatch(/^\d+(\.\d+)?s$/);
    expect(first[1]).toMatch(/^-\d+(\.\d+)?s$|^0s$/);
    rerender(<Avatar name="Inbox Assistant" />);
    expect([blink().style.animationDuration, blink().style.animationDelay]).not.toEqual(first);
  });

  it("draws the chosen accessory", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    expect(container.querySelector(".aaa-antenna-tip")).toBeNull();
    rerender(<Avatar accessory="antenna" name="a" />);
    expect(container.querySelector(".aaa-antenna-tip")).not.toBeNull();
  });

  it("play moves the mouth and the accessory with the mood", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} accessory="hat" mouth="smile" name="a" />);

    void ref.current!.play("failure");
    const animated = animate.mock.contexts.map((element) =>
      (element as Element).getAttribute("class"),
    );
    expect(animated).toEqual(
      expect.arrayContaining(["aaa-mouth-rest", "aaa-mood aaa-mood-sad", "aaa-accessory"]),
    );
  });

  it("play only squashes the resting mouth for events without a mood", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} accessory="none" mouth="flat" name="a" />);

    void ref.current!.play("acknowledge");
    const animated = animate.mock.contexts.map((element) =>
      (element as Element).getAttribute("class"),
    );
    expect(animated).toContain("aaa-mouth-rest");
    expect(animated.some((name) => name?.includes("aaa-mood"))).toBe(false);
  });

  it("renders mood mouths only for faces that have a mouth", () => {
    const { container, rerender } = render(<Avatar mouth="none" name="a" />);
    expect(container.querySelector(".aaa-mood")).toBeNull();
    rerender(<Avatar mouth="smile" name="a" />);
    expect(container.querySelectorAll(".aaa-mood")).toHaveLength(4);
    rerender(<Avatar content="initial" mouth="smile" name="a" />);
    expect(container.querySelector(".aaa-mood")).toBeNull();
  });
});
