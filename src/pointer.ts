const LOOK_RANGE = 7;
const FALLOFF = 240;

const watchers = new Set<SVGSVGElement>();
let pointer: { x: number; y: number } | null = null;
let frame = 0;

function aim() {
  frame = 0;
  const targets = [...watchers].map((svg) => ({ svg, bounds: svg.getBoundingClientRect() }));
  for (const { svg, bounds } of targets) {
    if (!pointer || bounds.bottom < 0 || bounds.top > window.innerHeight) {
      svg.style.removeProperty("--aaa-look-x");
      svg.style.removeProperty("--aaa-look-y");
      continue;
    }
    const dx = pointer.x - (bounds.left + bounds.width / 2);
    const dy = pointer.y - (bounds.top + bounds.height / 2);
    const distance = Math.hypot(dx, dy) || 1;
    const reach = (LOOK_RANGE * Math.min(distance, FALLOFF)) / FALLOFF;
    svg.style.setProperty("--aaa-look-x", `${((dx / distance) * reach).toFixed(2)}px`);
    svg.style.setProperty("--aaa-look-y", `${((dy / distance) * reach).toFixed(2)}px`);
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(aim);
}

function handleMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  pointer = { x: event.clientX, y: event.clientY };
  schedule();
}

function handleLeave() {
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
    svg.style.removeProperty("--aaa-look-x");
    svg.style.removeProperty("--aaa-look-y");
    if (watchers.size === 0) {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("pointerleave", handleLeave);
      pointer = null;
    }
  };
}
