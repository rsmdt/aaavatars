let observer: IntersectionObserver | null = null;
let watched = 0;

function handleEntries(entries: IntersectionObserverEntry[]) {
  for (const entry of entries) {
    if (entry.isIntersecting) entry.target.removeAttribute("data-offscreen");
    else entry.target.setAttribute("data-offscreen", "");
  }
}

export function watchVisibility(svg: SVGSVGElement): () => void {
  if (typeof IntersectionObserver !== "function") return () => {};
  observer ??= new IntersectionObserver(handleEntries);
  observer.observe(svg);
  watched += 1;
  return () => {
    observer?.unobserve(svg);
    svg.removeAttribute("data-offscreen");
    watched -= 1;
    if (watched === 0) {
      observer?.disconnect();
      observer = null;
    }
  };
}
