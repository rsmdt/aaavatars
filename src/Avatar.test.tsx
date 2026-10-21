import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AVATAR_EVENTS } from "./animations.js";
import { Avatar, type AvatarHandle, EXPRESSIONS } from "./Avatar.js";
import { AVATAR_CSS } from "./styles.js";

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
  it("exposes activity, expression and gaze for the CSS loops", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    const data = () => ({ ...container.querySelector("svg")!.dataset });
    expect(data()).toMatchObject({ activity: "idle", expression: "neutral", gaze: "follow" });
    rerender(<Avatar activity="working" expression="love" name="a" />);
    expect(data()).toMatchObject({ activity: "working", expression: "love", gaze: "scan" });
    rerender(<Avatar activity="working" gaze="wander" name="a" />);
    expect(data().gaze).toBe("wander");
  });

  it("moves the gaze on its own element so activity eye shapes survive any gaze", () => {
    const { container } = render(<Avatar activity="sleeping" gaze="scan" name="a" />);
    expect(container.querySelector(".aaa-gaze > .aaa-eyes-motion")).not.toBeNull();
    expect(AVATAR_CSS).not.toMatch(/aaa-eyes-motion\{[^}]*animation/);
  });

  it("lets a non-neutral expression own the blink over the activity", () => {
    expect(AVATAR_CSS).not.toMatch(/data-activity=\w+\] \.aaa-blink/);
  });

  it("lets a non-neutral expression own the mouth over the activity", () => {
    expect(AVATAR_CSS).not.toMatch(/data-activity=\w+\] \.aaa-mood-/);
    expect(AVATAR_CSS).toMatch(/\.aaa:not\(\[data-expression=neutral\]\) \.aaa-mouth-rest\{opacity:0\}/);
  });

  it("leans the eyes into one heart for love, whatever the activity", () => {
    const { container } = render(<Avatar activity="stuck" expression="love" name="a" />);
    expect(container.querySelectorAll(".aaa-eye")).toHaveLength(2);
    expect(AVATAR_CSS).toContain(".aaa[data-expression=love] .aaa-eye-l{transform:translateX(");
    expect(AVATAR_CSS).toContain(".aaa[data-expression=love] .aaa-eye-r{transform:translateX(");
    expect([...container.querySelectorAll(".aaa-eye")].map((eye) => eye.getAttribute("data-shape"))).toEqual(["eye", "eye"]);
  });

  it("gives each eye a top and bottom lid scaled to its height", () => {
    const { container } = render(<Avatar eyes="tall" name="a" />);
    const lids = [...container.querySelectorAll<SVGRectElement>(".aaa-lid")];
    expect(lids.map((lid) => lid.getAttribute("class"))).toEqual([
      "aaa-lid aaa-lid-top aaa-lid-l",
      "aaa-lid aaa-lid-bottom aaa-lid-l",
      "aaa-lid aaa-lid-top aaa-lid-r",
      "aaa-lid aaa-lid-bottom aaa-lid-r",
    ]);
    expect(lids.every((lid) => lid.dataset.h === "11")).toBe(true);
  });

  it("expresses every non-neutral expression and the closed activities through the lids", () => {
    for (const state of [
      "data-expression=happy] .aaa-lid-bottom",
      "data-expression=sad] .aaa-lid-top.aaa-lid-l",
      "data-expression=sad] .aaa-lid-top.aaa-lid-r",
      "data-expression=confused] .aaa-lid-top.aaa-lid-r",
      "data-activity=sleeping] .aaa-lid-top",
      "data-activity=sleeping] .aaa-lid-bottom",
    ]) {
      expect(AVATAR_CSS).toContain(state);
    }
    expect(AVATAR_CSS.indexOf(".aaa:not([data-expression=neutral]) .aaa-lid{transform:none}")).toBeGreaterThan(
      AVATAR_CSS.indexOf("[data-activity=sleeping] .aaa-lid-bottom"),
    );
  });

  it("morphs the real eyes into a >_ prompt with a blinking cursor while coding", () => {
    const { container } = render(<Avatar activity="coding" name="a" />);
    const shapes = [...container.querySelectorAll(".aaa-eye")].map((eye) => eye.getAttribute("data-shape"));
    expect(shapes).toEqual(["prompt", "prompt"]);
    expect(container.querySelectorAll(".aaa-shape")).toHaveLength(2);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
    expect(AVATAR_CSS).toContain(".aaa[data-activity=coding][data-expression=neutral] .aaa-eye-r{animation:aaa-caret");
    expect(AVATAR_CSS).toContain(".aaa-eye:not([data-shape=eye]) .aaa-lid-top{transform:translateY(-12px)}");
  });

  it("draws every eye pose with the same path commands so it can morph", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    for (const eyes of ["dot", "round", "tall", "wide"] as const) {
      for (const activity of ["idle", "coding", "stuck", "listening"] as const) {
        rerender(<Avatar activity={activity} eyes={eyes} name="a" />);
        for (const shape of container.querySelectorAll(".aaa-shape")) {
          expect(shape.getAttribute("d")).toMatch(/^M[^A-Z]*(C[^A-Z]*){12}Z$/);
        }
      }
    }
    expect(AVATAR_CSS).toContain(".aaa-shape{transition:d .32s");
  });

  it("morphs back to round eyes while a reaction plays, then returns to the activity pose", async () => {
    stubMatchMedia(false);
    const { finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    const { container } = render(<Avatar ref={ref} activity="coding" name="a" />);
    const shape = () => container.querySelector(".aaa-eye-l")!.getAttribute("data-shape");
    let playing!: Promise<void>;
    act(() => {
      playing = ref.current!.play("success");
    });
    expect(shape()).toBe("eye");
    await act(async () => {
      finishAll();
      await playing;
    });
    expect(shape()).toBe("prompt");
  });

  it("keeps the eyes closed while sleeping, whatever the expression", () => {
    const { container } = render(<Avatar activity="sleeping" expression="happy" name="a" />);
    expect(container.querySelector("svg")!.dataset.expression).toBe("neutral");
  });

  it("falls asleep and wakes up with the lid sequences, but not on mount", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const topLidFrames = () =>
      (animate.mock.calls as unknown as [Keyframe[]][])
        .filter((_, index) => (animate.mock.contexts[index] as Element).classList.contains("aaa-lid-top"))
        .map(([frames]) => frames);
    const { container, rerender } = render(<Avatar activity="sleeping" eyes="dot" name="a" />);
    expect(animate).not.toHaveBeenCalled();

    rerender(<Avatar activity="idle" eyes="dot" name="a" />);
    expect(topLidFrames()).toHaveLength(2);
    expect(topLidFrames()[0]![0]).toMatchObject({ offset: 0, transform: `translateY(${(0.85 * 7).toFixed(2)}px) rotate(0deg)` });
    expect(topLidFrames()[0]!.at(-1)).not.toHaveProperty("transform");
    expect(container.querySelector("svg")!.dataset.reacting).toBe("wake");

    animate.mockClear();
    rerender(<Avatar activity="sleeping" eyes="dot" name="a" />);
    expect(topLidFrames()).toHaveLength(2);
    expect(topLidFrames()[0]!.at(-1)).not.toHaveProperty("transform");
    const bodyIndex = animate.mock.contexts.findIndex((element) =>
      (element as Element).classList.contains("aaa-react"),
    );
    expect((animate.mock.calls[bodyIndex] as unknown as [Keyframe[]])[0][0]).toMatchObject({
      offset: 0,
      transform: "translateY(0)",
    });
    expect(AVATAR_CSS).toContain(".aaa[data-activity=sleeping] .aaa-lid-top{transform:translateY(calc(var(--aaa-eye-h)*.85px))}");
  });

  it("turns both eyes into crosses while stuck", () => {
    const { container } = render(<Avatar activity="stuck" name="a" />);
    const shapes = [...container.querySelectorAll(".aaa-eye")].map((eye) => eye.getAttribute("data-shape"));
    expect(shapes).toEqual(["cross", "cross"]);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
  });

  it("looks straight out with one eye wider while asking", () => {
    const { container } = render(<Avatar activity="asking" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
    expect(AVATAR_CSS).toContain(".aaa[data-activity=asking][data-expression=neutral] .aaa-eye-r{transform:scale(1.25)}");
    expect(AVATAR_CSS).not.toMatch(/data-activity=asking\][^{]*\.aaa-blink/);
  });

  it("reads line by line while reading", () => {
    const { container } = render(<Avatar activity="reading" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("read");
    const read = AVATAR_CSS.match(/@keyframes aaa-read\{(.*?)\}\}/)![1]!;
    for (const line of ["-2px", "0.5px", "3px"]) expect(read).toContain(`translate(-5px,${line})`);
    expect(AVATAR_CSS).toContain(".aaa[data-gaze=read] .aaa-gaze{animation:aaa-read");
  });

  it("merges the eyes into one blinking cursor while listening", () => {
    const { container } = render(<Avatar activity="listening" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
    const shapes = [...container.querySelectorAll(".aaa-eye")].map((eye) => eye.getAttribute("data-shape"));
    expect(shapes).toEqual(["cursor", "cursor"]);
    expect(AVATAR_CSS).toContain(".aaa[data-activity=listening][data-expression=neutral] .aaa-eye{animation:aaa-caret");
  });

  it("narrows the eyes to a slit and inspects up and down while reviewing", () => {
    const { container } = render(<Avatar activity="reviewing" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
    expect(AVATAR_CSS).toContain(".aaa[data-activity=reviewing] .aaa-lid-top{transform:translateY(calc(var(--aaa-eye-h)*.78px))}");
    const inspect = AVATAR_CSS.match(/@keyframes aaa-inspect\{(.*?)\}\}/)![1]!;
    expect(inspect).toContain("translateY(calc(var(--aaa-eye-h)*.55px))");
    expect(inspect).toContain("translateY(calc(var(--aaa-eye-h)*-.55px))");
  });

  it("winces asymmetrically for a warning", async () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);
    void ref.current!.play("warning");
    const eyeFrames = (animate.mock.calls as unknown as [Keyframe[]][])
      .filter((_, index) => (animate.mock.contexts[index] as Element).classList.contains("aaa-eye"))
      .map(([frames]) => frames.map((frame) => frame.transform).join(" "));
    expect(eyeFrames).toHaveLength(2);
    expect(eyeFrames[0]).toContain("scale(1.37,1.4)");
    expect(eyeFrames[1]).toContain("scale(.68,.99)");
  });

  it("wakes only by leaving sleeping, not through play()", () => {
    expect(AVATAR_EVENTS).not.toContain("wake");
  });

  it("sweeps the eyes once when it gets stuck, but not on mount", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const { container, rerender } = render(<Avatar activity="stuck" name="a" />);
    expect(animate).not.toHaveBeenCalled();
    rerender(<Avatar activity="idle" name="a" />);
    rerender(<Avatar activity="stuck" name="a" />);
    expect(animate).toHaveBeenCalled();
    expect(container.querySelector("svg")!.dataset.reacting).toBe("stuck");
  });

  it("shows x x eyes while the error event plays, then round eyes again", async () => {
    stubMatchMedia(false);
    const { finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    const { container } = render(<Avatar ref={ref} name="a" />);
    const shapes = () => [...container.querySelectorAll(".aaa-eye")].map((eye) => eye.getAttribute("data-shape"));

    let played!: Promise<void>;
    act(() => {
      played = ref.current!.play("error");
    });
    expect(shapes()).toEqual(["cross", "cross"]);
    await act(async () => {
      finishAll();
      await played;
    });
    expect(shapes()).toEqual(["eye", "eye"]);
  });

  it("settles to neutral before a played reaction, but reacts at once to a click", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    const { container } = render(<Avatar ref={ref} interactive name="a" />);
    const bodyCall = () => {
      const index = animate.mock.contexts.findIndex((element) =>
        (element as Element).classList.contains("aaa-react"),
      );
      return animate.mock.calls[index] as unknown as [Keyframe[], KeyframeAnimationOptions];
    };

    void ref.current!.play("acknowledge");
    const [prepared, preparedTiming] = bodyCall();
    expect(prepared[0]).not.toHaveProperty("transform");
    expect(prepared[1]).toMatchObject({ transform: "none" });
    expect(preparedTiming).toMatchObject({ duration: 500 + 920, easing: "linear" });

    animate.mockClear();
    fireEvent.click(container.querySelector("svg")!);
    const [immediate, immediateTiming] = bodyCall();
    expect(immediate[0]).toMatchObject({ offset: 0, transform: "translateY(0)" });
    expect(immediateTiming).toMatchObject({ duration: 920 });
  });

  it("centres the gaze and holds blinking while reacting, and clears the flag after", async () => {
    stubMatchMedia(false);
    const { finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    const { container } = render(<Avatar ref={ref} name="a" />);
    const playing = ref.current!.play("warning");
    expect(container.querySelector("svg")!.dataset.reacting).toBe("warning");
    expect(AVATAR_CSS).toContain(".aaa[data-reacting] .aaa-gaze,.aaa[data-reacting] .aaa-blink,.aaa[data-reacting] .aaa-eye{animation:none}");
    await act(async () => {
      finishAll();
      await playing;
    });
    expect(container.querySelector("svg")!.dataset.reacting).toBeUndefined();
    expect(["0", "0.41", "0.7"]).toContain(
      container.querySelector("svg")!.style.getPropertyValue("--aaa-gaze-phase"),
    );
  });

  it("moves each eye on its own during a warning", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);
    void ref.current!.play("warning");
    const eyes = animate.mock.contexts.filter((element) =>
      (element as Element).classList.contains("aaa-eye"),
    );
    expect(eyes).toHaveLength(2);
  });

  it("pauses its loops while offscreen", () => {
    let report: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback;
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    const { container } = render(<Avatar name="a" />);
    const svg = container.querySelector("svg")!;
    act(() => report([{ isIntersecting: false, target: svg } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(svg.hasAttribute("data-offscreen")).toBe(true);
    act(() => report([{ isIntersecting: true, target: svg } as unknown as IntersectionObserverEntry], {} as IntersectionObserver));
    expect(svg.hasAttribute("data-offscreen")).toBe(false);
    expect(AVATAR_CSS).toContain(".aaa[data-offscreen] *{animation-play-state:paused!important}");
  });

  it("wanders with saccades from the centre, ponders, scans and orbits while waiting", () => {
    expect(AVATAR_CSS).toMatch(/@keyframes aaa-saccade\{0%\{transform:translate\(0px,0px\) scaleX\(1\.000\)/);
    expect(AVATAR_CSS).toContain(".aaa[data-gaze=follow]:not([data-pointer]) .aaa-gaze,.aaa[data-gaze=wander] .aaa-gaze{animation:aaa-saccade");
    expect(AVATAR_CSS).toContain(".aaa[data-gaze=ponder] .aaa-gaze{animation:aaa-ponder");
    const ponder = AVATAR_CSS.match(/@keyframes aaa-ponder\{.*\}\}/)![0];
    const percents = [...ponder.matchAll(/(\d+(?:\.\d+)?)%\{/g)].map((match) => match[1]);
    expect(new Set(percents).size).toBe(percents.length);
    expect(ponder.split("cubic-bezier(.22,1,.36,1)").length - 1).toBeGreaterThanOrEqual(3);
    expect(AVATAR_CSS).toContain(".aaa[data-activity=waiting] .aaa-eye-l{animation:aaa-orbit-l 3.2s linear .32s infinite}");
    const { container } = render(<Avatar activity="waiting" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
  });

  it("adds no mouth for an expression when the mouth is off", () => {
    const { container } = render(<Avatar expression="happy" name="a" />);
    expect(container.querySelector(".aaa-mouth-rest")).toBeNull();
    expect(container.querySelector(".aaa-mood")).toBeNull();
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
    expect(container.querySelector(`clipPath[id$="-frame"]`)).toBeNull();
  });

  it("play resolves after both body and eye animations finish", async () => {
    stubMatchMedia(false);
    const { animate, finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} accessory="none" mouth="none" name="a" />);

    let resolved = false;
    const playing = ref.current!.play("success").then(() => {
      resolved = true;
    });
    expect(animate).toHaveBeenCalledTimes(6);
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

    await expect(ref.current!.play("success")).resolves.toBeUndefined();
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

  it("follows the pointer anywhere on the page only while the gaze is follow", () => {
    stubMatchMedia(false);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    const { container, rerender } = render(<Avatar name="a" />);
    const svg = () => container.querySelector("svg")!;
    fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
    expect(Number.parseFloat(svg().style.getPropertyValue("--aaa-look-x"))).toBeGreaterThan(0);
    expect(Number.parseFloat(svg().style.getPropertyValue("--aaa-look-y"))).toBeGreaterThan(0);

    for (const props of [{ gaze: "ahead" }, { activity: "thinking" }] as const) {
      rerender(<Avatar {...props} name="b" />);
      svg().style.removeProperty("--aaa-look-x");
      fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
      expect(svg().style.getPropertyValue("--aaa-look-x")).toBe("");
    }
  });

  it("hands the eyes back to their saccades 900ms after the pointer stops", () => {
    vi.useFakeTimers();
    stubMatchMedia(false);
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    const { container } = render(<Avatar name="a" />);
    const svg = container.querySelector("svg")!;
    fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
    expect(svg.hasAttribute("data-pointer")).toBe(true);
    expect(Number.parseFloat(svg.style.getPropertyValue("--aaa-head-x"))).toBeGreaterThan(0);
    vi.advanceTimersByTime(899);
    expect(svg.hasAttribute("data-pointer")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(svg.hasAttribute("data-pointer")).toBe(false);
    expect(svg.style.getPropertyValue("--aaa-look-x")).toBe("");
    expect(["0", "0.41", "0.7"]).toContain(svg.style.getPropertyValue("--aaa-gaze-phase"));
    vi.useRealTimers();
  });

  it("ignores touch pointers and reduced motion when following", () => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    stubMatchMedia(false);
    const { container, unmount } = render(<Avatar name="a" />);
    fireEvent.pointerMove(window, { clientX: 400, clientY: 300, pointerType: "touch" });
    expect(container.querySelector("svg")!.style.getPropertyValue("--aaa-look-x")).toBe("");
    unmount();

    stubMatchMedia(true);
    const reduced = render(<Avatar name="a" />);
    fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
    expect(reduced.container.querySelector("svg")!.style.getPropertyValue("--aaa-look-x")).toBe("");
  });

  it("sets a per-name tempo and phase for its looping animations", () => {
    const { container, rerender } = render(<Avatar name="Research" />);
    const svg = () => container.querySelector("svg")!;
    const first = [
      svg().style.getPropertyValue("--aaa-tempo"),
      svg().style.getPropertyValue("--aaa-phase"),
    ];
    expect(Number.parseFloat(first[0]!)).toBeGreaterThan(0);
    rerender(<Avatar name="Inbox Assistant" />);
    expect([
      svg().style.getPropertyValue("--aaa-tempo"),
      svg().style.getPropertyValue("--aaa-phase"),
    ]).not.toEqual(first);
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

  it("reports the playing event through onChange, then null when it ends", async () => {
    stubMatchMedia(false);
    const { finishAll } = stubAnimate();
    const onChange = vi.fn();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" onChange={onChange} />);

    let played!: Promise<void>;
    act(() => {
      played = ref.current!.play("success");
    });
    expect(onChange).toHaveBeenLastCalledWith("success");
    await act(async () => {
      finishAll();
      await played;
    });
    expect(onChange.mock.calls).toEqual([["success"], [null]]);
  });

  it("does not report null for an event replaced by a newer one", async () => {
    stubMatchMedia(false);
    const { finishAll } = stubAnimate();
    const onChange = vi.fn();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" onChange={onChange} />);

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = ref.current!.play("success");
      second = ref.current!.play("error");
    });
    await act(async () => {
      finishAll();
      await Promise.all([first, second]);
    });
    expect(onChange.mock.calls).toEqual([["success"], ["error"], [null]]);
  });

  it("play moves the mouth and the accessory with the mood", () => {
    stubMatchMedia(false);
    const { animate } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} accessory="hat" mouth="smile" name="a" />);

    void ref.current!.play("error");
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
    expect(container.querySelectorAll(".aaa-mood")).toHaveLength(5);
    rerender(<Avatar content="initial" mouth="smile" name="a" />);
    expect(container.querySelector(".aaa-mood")).toBeNull();
  });

  it("gives every new work feeling its own lids", () => {
    for (const expression of ["tired", "curious"] as const) {
      const { container, unmount } = render(<Avatar expression={expression} name="a" />);
      expect(container.querySelector("svg")!.dataset.expression).toBe(expression);
      expect(AVATAR_CSS).toContain(`.aaa[data-expression=${expression}]`);
      unmount();
    }
  });

  it("searches with darting eyes and writes along a line", () => {
    const { container, rerender } = render(<Avatar activity="searching" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("ahead");
    expect(AVATAR_CSS).toContain(".aaa[data-activity=searching][data-expression=neutral] .aaa-eye{animation:aaa-search");
    rerender(<Avatar activity="writing" name="a" />);
    expect(container.querySelector("svg")!.dataset.gaze).toBe("read");
    expect(AVATAR_CSS).toContain(".aaa[data-activity=writing] .aaa-body-motion{animation:aaa-bob");
  });

  it("looks down at the work or away from the viewer", () => {
    expect(AVATAR_CSS).toContain(".aaa[data-gaze=down] .aaa-gaze{animation:aaa-down");
    expect(AVATAR_CSS).toContain(".aaa[data-gaze=away] .aaa-gaze{animation:aaa-away");
  });

  it("plays the new reactions", async () => {
    stubMatchMedia(false);
    const { animate, finishAll } = stubAnimate();
    const ref = createRef<AvatarHandle>();
    render(<Avatar ref={ref} name="a" />);
    for (const event of ["sigh", "yawn"] as const) {
      expect(AVATAR_EVENTS).toContain(event);
      animate.mockClear();
      let played!: Promise<void>;
      act(() => {
        played = ref.current!.play(event);
      });
      expect(animate).toHaveBeenCalled();
      await act(async () => {
        finishAll();
        await played;
      });
    }
  });

  it("draws flat by default and shades like soft clay when asked, with a sheen that rides the gaze", () => {
    const { container, rerender } = render(<Avatar name="a" />);
    expect(container.querySelector(".aaa-rim")).toBeNull();
    expect(container.querySelector(".aaa-sheen")).toBeNull();
    expect(container.querySelector(".aaa-shadow")).toBeNull();
    rerender(<Avatar name="a" shading={0.6} />);
    expect(container.querySelector(".aaa-rim")).not.toBeNull();
    expect(container.querySelector(".aaa-gaze > .aaa-sheen")).not.toBeNull();
    expect(container.querySelector(".aaa-head > .aaa-shadow")).not.toBeNull();
    expect(container.querySelector(".aaa-body-motion .aaa-shadow")).toBeNull();
  });

  it("keeps each layer's values distinct", () => {
    expect([...AVATAR_EVENTS]).toEqual(["acknowledge", "handoff", "success", "warning", "error", "surprised", "sigh", "yawn"]);
    expect([...EXPRESSIONS]).toEqual(["neutral", "happy", "sad", "angry", "confused", "curious", "tired", "love"]);
    expect([...EXPRESSIONS].filter((name) => (AVATAR_EVENTS as readonly string[]).includes(name))).toEqual([]);
  });

  it("widens both eyes when curious, unlike asking's one wider eye", () => {
    expect(AVATAR_CSS).toContain(".aaa[data-expression=curious] .aaa-eyes-motion{transform:scale(1.12)}");
    expect(AVATAR_CSS).not.toContain(".aaa[data-expression=curious] .aaa-eye-l");
  });
});
