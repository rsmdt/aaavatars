const LOOK_X = 7;
const LOOK_Y = 5;
const HEAD_SHIFT = 2.2;
const HEAD_TILT = 8;
const STALE_MS = 900;

const watchers = new Set<SVGSVGElement>();
let pointer: { x: number; y: number } | null = null;
let frame = 0;
let staleTimer: ReturnType<typeof setTimeout> | undefined;

const PROPERTIES = [
  "--aaa-look-x",
  "--aaa-look-y",
  "--aaa-look-sx",
  "--aaa-head-x",
  "--aaa-head-y",
  "--aaa-head-r",
];

const CENTRED_PHASES = [0, 0.41, 0.7];

export function restartGazeCentred(svg: SVGSVGElement) {
  const phase = Number.parseFloat(svg.style.getPropertyValue("--aaa-phase")) || 0;
  const cohort = Math.min(Math.floor(phase * CENTRED_PHASES.length), CENTRED_PHASES.length - 1);
  const glancing = svg.dataset.gaze === "follow" || svg.dataset.gaze === "wander";
  svg.style.setProperty("--aaa-gaze-phase", glancing ? String(CENTRED_PHASES[cohort]) : "0");
}

function release(svg: SVGSVGElement) {
  if (!svg.hasAttribute("data-pointer")) return;
  for (const property of PROPERTIES) svg.style.removeProperty(property);
  restartGazeCentred(svg);
  svg.removeAttribute("data-pointer");
}

function clamp(value: number, limit: number): number {
  return Math.max(-limit, Math.min(limit, value));
}

function aim() {
  frame = 0;
  const targets = [...watchers]
    .filter((svg) => !svg.hasAttribute("data-offscreen"))
    .map((svg) => ({ svg, bounds: svg.getBoundingClientRect() }));
  for (const { svg, bounds } of targets) {
    if (!pointer || bounds.bottom < 0 || bounds.top > window.innerHeight) {
      release(svg);
      continue;
    }
    const size = Math.max(bounds.width, 1);
    const dx = (pointer.x - (bounds.left + bounds.width / 2)) / size;
    const dy = (pointer.y - (bounds.top + bounds.height / 2)) / size;
    const x = clamp(dx * LOOK_X, LOOK_X);
    const y = clamp(dy * LOOK_Y * 0.9, LOOK_Y);
    const nx = x / LOOK_X;
    const ny = y / LOOK_Y;
    svg.setAttribute("data-pointer", "");
    svg.style.setProperty("--aaa-look-x", `${x.toFixed(2)}px`);
    svg.style.setProperty("--aaa-look-y", `${y.toFixed(2)}px`);
    svg.style.setProperty("--aaa-look-sx", (1 - 0.06 * nx * nx).toFixed(3));
    svg.style.setProperty("--aaa-head-x", `${(nx * HEAD_SHIFT).toFixed(2)}px`);
    svg.style.setProperty("--aaa-head-y", `${(ny * HEAD_SHIFT).toFixed(2)}px`);
    svg.style.setProperty("--aaa-head-r", `${(nx * ny * HEAD_TILT).toFixed(2)}deg`);
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(aim);
}

function handleMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  pointer = { x: event.clientX, y: event.clientY };
  schedule();
  clearTimeout(staleTimer);
  staleTimer = setTimeout(handleLeave, STALE_MS);
}

function handleLeave() {
  clearTimeout(staleTimer);
  pointer = null;
  schedule();
}

export function watchPointer(svg: SVGSVGElement): () => void {
  if (watchers.size === 0) {
    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", handleLeave);
  }
  watchers.add(svg);
  return () => {
    watchers.delete(svg);
    release(svg);
    if (watchers.size === 0) {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      clearTimeout(staleTimer);
      pointer = null;
    }
  };
}
