const EASE_OUT = "cubic-bezier(.22,1,.36,1)";
const EASE_SPRING = "cubic-bezier(.34,1.56,.64,1)";
const EASE_SMOOTH = "cubic-bezier(.37,0,.63,1)";

type Glance = [percent: number, x: number, y: number];

function gazeTransform(x: number, y: number): string {
  const squash = 1 - 0.06 * Math.min((x / 6) ** 2, 1);
  return `translate(${x}px,${y}px) scaleX(${squash.toFixed(3)})`;
}

function glances(name: string, points: Glance[], move: number): string {
  const frames = points.flatMap(([percent, x, y], index) => {
    const next = points[index + 1];
    const transform = gazeTransform(x, y);
    const arrive = `${percent}%{transform:${transform};animation-timing-function:linear}`;
    if (!next) return [arrive];
    const leave = `${Math.max(percent, next[0] - move)}%{transform:${transform};animation-timing-function:${EASE_OUT}}`;
    return [arrive, leave];
  });
  return `@keyframes ${name}{${frames.join("")}}`;
}

function orbit(name: string, side: -1 | 1): string {
  const frames = Array.from({ length: 17 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 4;
    const cos = Math.cos(angle);
    const depth = 1 - side * 0.08 * Math.sin(angle);
    const foreshorten = 0.72 + 0.28 * Math.abs(cos);
    const shift = (-side * (1 - cos)).toFixed(4);
    return `${(index / 16) * 100}%{transform:translateX(calc(var(--aaa-gap)*${shift}px)) scale(${(foreshorten * depth).toFixed(3)},${depth.toFixed(3)})}`;
  });
  return `@keyframes ${name}{${frames.join("")}}`;
}

function blinks(percents: number[], half: number): string {
  const open = [0, 100, ...percents.flatMap((at) => [at - half, at + half])];
  return `@keyframes aaa-blink{${open.map((at) => `${at.toFixed(2)}%`).join(",")}{transform:scaleY(1)}${percents.map((at) => `${at}%`).join(",")}{transform:scaleY(.08)}}`;
}

const lid = (amount: string) => `translateY(calc(var(--aaa-eye-h)*${amount}px))`;

const HEART = (side: -1 | 1) =>
  `translateX(calc((var(--aaa-gap) + 3.6)*${-side}px)) rotate(${side * 42}deg) scale(calc(7.5/var(--aaa-eye-w)),calc(11.5/var(--aaa-eye-h)))`;

const timeline = (name: string, total: number, stops: [ms: number, transform: string][]) =>
  `@keyframes ${name}{${stops.map(([ms, transform]) => `${+((ms / total) * 100).toFixed(3)}%{transform:${transform};animation-timing-function:${EASE_SMOOTH}}`).join("")}}`;

const peek = (amount: string) => `translateY(calc(var(--aaa-eye-h)*${amount}px))`;

const loop = (seconds: number, easing = "ease-in-out") =>
  `calc(${seconds}s*var(--aaa-tempo,1)) ${easing} calc(-${seconds}s*var(--aaa-phase,0)) infinite`;

const gazeLoop = (seconds: number) =>
  `calc(${seconds}s*var(--aaa-tempo,1)) linear calc(-${seconds}s*var(--aaa-gaze-phase,var(--aaa-phase,0))) infinite`;

export const AVATAR_CSS = `
.aaa-body-motion,.aaa-react,.aaa-eyes-react,.aaa-gaze,.aaa-eyes-motion,.aaa-blink,.aaa-squish,.aaa-head,.aaa-look,.aaa-eye{transform-box:fill-box;transform-origin:center}
.aaa-mouth-rest,.aaa-mood{transform-box:fill-box;transform-origin:center;transition:opacity .2s,transform .2s}
.aaa-mood{opacity:0}
.aaa-accessory{transform-box:fill-box;transform-origin:50% 100%;transition:transform .3s ease-out}
.aaa-accessory[data-accessory=glasses],.aaa-accessory[data-accessory=bowtie]{transform-origin:center}
.aaa-squish{transition:transform .45s ${EASE_SPRING}}
.aaa-squish[data-dragging]{transition:none}
.aaa[data-interactive]{cursor:grab;touch-action:none}
.aaa[data-interactive]:active{cursor:grabbing}
.aaa-look{transform:translate(var(--aaa-look-x,0px),var(--aaa-look-y,0px)) scaleX(var(--aaa-look-sx,1));transition:transform .28s ${EASE_OUT}}
.aaa-head{transform:translate(var(--aaa-head-x,0px),var(--aaa-head-y,0px)) rotate(var(--aaa-head-r,0deg));transition:transform .6s ${EASE_SPRING}}
.aaa-eyes-motion{transition:transform .32s cubic-bezier(.16,1,.3,1)}
.aaa-eye{transition:transform .32s cubic-bezier(.16,1,.3,1)}
.aaa-blink{animation:aaa-blink 14s linear infinite}
.aaa-lid{transform-box:fill-box;transition:transform .32s cubic-bezier(.16,1,.3,1)}
.aaa-lid-top{transform-origin:50% 100%}
.aaa-lid-bottom{transform-origin:50% 0}
.aaa-shape{transition:d .32s cubic-bezier(.16,1,.3,1)}
.aaa-eye:not([data-shape=eye]) .aaa-lid-top{transform:translateY(-12px)}
.aaa-eye:not([data-shape=eye]) .aaa-lid-bottom{transform:translateY(12px)}
.aaa[data-activity=idle] .aaa-body-motion{animation:aaa-drift ${loop(11)}}
.aaa[data-activity=thinking] .aaa-body-motion{animation:aaa-sway ${loop(3)}}
.aaa[data-activity=coding] .aaa-body-motion{animation:aaa-bob ${loop(1.6)}}
.aaa[data-activity=coding][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=coding][data-expression=neutral] .aaa-eye-r{animation:aaa-caret 1.06s steps(1) .32s infinite}
.aaa[data-activity=working] .aaa-body-motion{animation:aaa-bob ${loop(0.9)}}
.aaa[data-activity=waiting] .aaa-eye-l{animation:aaa-orbit-l 3.2s linear .32s infinite}
.aaa[data-activity=waiting] .aaa-eye-r{animation:aaa-orbit-r 3.2s linear .32s infinite}
.aaa[data-activity=waiting][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=asking] .aaa-body-motion{transform:rotate(-7deg)}
.aaa[data-activity=asking][data-expression=neutral] .aaa-eye-r{transform:scale(1.25)}
.aaa[data-activity=stuck] .aaa-body-motion{transform:rotate(-10deg)}
.aaa[data-activity=stuck][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=sleeping] .aaa-body-motion{animation:aaa-breathe ${loop(4.2)}}
.aaa[data-activity=sleeping] .aaa-lid-top{transform:${lid(".85")}}
.aaa[data-activity=sleeping] .aaa-lid-bottom{transform:${lid("-.85")}}
.aaa[data-activity=sleeping] .aaa-react{transform:translateY(3px)}
.aaa[data-activity=sleeping][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=listening] .aaa-body-motion{animation:aaa-nod ${loop(2.8)}}
.aaa[data-activity=listening][data-expression=neutral] .aaa-eye{animation:aaa-caret 1.06s steps(1) .32s infinite}
.aaa[data-activity=listening][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=reviewing] .aaa-lid-top{transform:${lid(".78")}}
.aaa[data-activity=reviewing] .aaa-lid-bottom{transform:${lid("-.78")}}
.aaa[data-activity=reviewing][data-expression=neutral] .aaa-blink{animation:none}
.aaa[data-activity=reviewing] .aaa-eye{animation:aaa-inspect ${loop(6.08, "linear")}}
.aaa[data-activity=reviewing] .aaa-body-motion{animation:aaa-inspect-head ${loop(6.08, "linear")}}
.aaa[data-activity=speaking] .aaa-body-motion{animation:aaa-bob ${loop(1.4)}}
.aaa[data-activity=speaking] .aaa-mouth-rest{animation:aaa-talk .32s ease-in-out infinite}
.aaa[data-gaze=follow]:not([data-pointer]) .aaa-gaze,.aaa[data-gaze=wander] .aaa-gaze{animation:aaa-saccade ${gazeLoop(16)}}
.aaa[data-gaze=ponder] .aaa-gaze{animation:aaa-ponder ${gazeLoop(3.6)}}
.aaa[data-gaze=scan] .aaa-gaze{animation:aaa-scan ${gazeLoop(1.6)}}
.aaa[data-gaze=read] .aaa-gaze{animation:aaa-read ${gazeLoop(4.8)}}
.aaa[data-gaze=down] .aaa-gaze{animation:aaa-down ${gazeLoop(7)}}
.aaa[data-gaze=away] .aaa-gaze{animation:aaa-away ${gazeLoop(9)}}
.aaa[data-activity=searching] .aaa-body-motion{transform:translateY(1px) scale(1.04)}
.aaa[data-activity=searching][data-expression=neutral] .aaa-eye{animation:aaa-search ${loop(2.6, "linear")}}
.aaa[data-activity=writing] .aaa-body-motion{animation:aaa-bob ${loop(2.4)}}
.aaa[data-activity=working] .aaa-antenna-tip{animation:aaa-signal .9s ease-in-out infinite}
.aaa[data-activity=thinking][data-expression=neutral] .aaa-mouth-rest{opacity:0}
.aaa[data-activity=thinking][data-expression=neutral] .aaa-mood-small{opacity:1}
.aaa[data-activity=thinking] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){animation:aaa-acc-sway 2.4s ease-in-out infinite}
.aaa[data-activity=thinking] .aaa-accessory[data-accessory=glasses]{animation:aaa-glasses-think 2.4s ease-in-out infinite}
.aaa[data-activity=working] .aaa-mouth-rest{transform:scaleX(.7)}
.aaa[data-activity=working] .aaa-accessory[data-accessory=bowtie]{animation:aaa-wobble .9s ease-in-out infinite}
.aaa[data-activity=waiting][data-expression=neutral] .aaa-mouth-rest{opacity:0}
.aaa[data-activity=waiting][data-expression=neutral] .aaa-mood-happy{opacity:1}
.aaa[data-activity=waiting] .aaa-accessory:not([data-accessory=glasses]){animation:aaa-wobble 1.6s ease-in-out infinite}
.aaa[data-activity=stuck][data-expression=neutral] .aaa-mouth-rest{opacity:0}
.aaa[data-activity=stuck][data-expression=neutral] .aaa-mood-sad{opacity:1}
.aaa[data-activity=stuck] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){transform:rotate(28deg)}
.aaa[data-activity=stuck] .aaa-accessory:is([data-accessory=hat],[data-accessory=glasses]){transform:translateY(3px) rotate(8deg)}
.aaa[data-activity=stuck] .aaa-accessory[data-accessory=bowtie]{transform:rotate(18deg)}
.aaa[data-activity=sleeping][data-expression=neutral] .aaa-mouth-rest{opacity:0}
.aaa[data-activity=sleeping][data-expression=neutral] .aaa-mood-o{opacity:1;animation:aaa-snore 4.2s ease-in-out infinite}
.aaa[data-activity=sleeping] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){transform:rotate(-35deg)}
.aaa[data-activity=sleeping] .aaa-accessory:is([data-accessory=hat],[data-accessory=glasses]){transform:translateY(5px)}
.aaa:not([data-expression=neutral]) .aaa-mouth-rest{opacity:0}
.aaa:is([data-expression=happy],[data-expression=love]) .aaa-mood-happy{opacity:1}
.aaa:is([data-expression=sad],[data-expression=angry]) .aaa-mood-sad{opacity:1}
.aaa[data-expression=confused] .aaa-mood-small{opacity:1}
.aaa[data-expression=tired] .aaa-mood-flat{opacity:1}
.aaa[data-expression=curious] .aaa-mood-o{opacity:1;transform:scale(.6)}
.aaa:not([data-expression=neutral]) .aaa-lid{transform:none}
.aaa:not([data-expression=neutral]) .aaa-eye{animation:none}
.aaa[data-expression=happy] .aaa-lid-bottom{transform:${lid("-1")}}
.aaa[data-expression=sad] .aaa-lid-top.aaa-lid-l{transform:${lid(".8")} rotate(-16deg)}
.aaa[data-expression=sad] .aaa-lid-top.aaa-lid-r{transform:${lid(".8")} rotate(16deg)}
.aaa[data-expression=angry] .aaa-lid-top.aaa-lid-l{transform:${lid(".83")} rotate(16deg)}
.aaa[data-expression=angry] .aaa-lid-top.aaa-lid-r{transform:${lid(".83")} rotate(-16deg)}
.aaa[data-expression=confused] .aaa-lid-top.aaa-lid-r{transform:${lid(".55")} rotate(-8deg)}
.aaa[data-expression=love] .aaa-eye{transform-origin:50% 100%}
.aaa[data-expression=love] .aaa-eye-l{transform:${HEART(-1)}}
.aaa[data-expression=love] .aaa-eye-r{transform:${HEART(1)}}
.aaa[data-expression=love] .aaa-eyes-react{animation:aaa-heartbeat 1.52s infinite}
.aaa[data-expression=tired] .aaa-lid-top.aaa-lid-l{transform:${lid(".6")} rotate(-7deg)}
.aaa[data-expression=tired] .aaa-lid-top.aaa-lid-r{transform:${lid(".6")} rotate(7deg)}
.aaa[data-expression=tired] .aaa-lid-bottom{transform:${lid("-.12")}}
.aaa[data-expression=curious] .aaa-eyes-motion{transform:scale(1.12)}
.aaa[data-reacting] .aaa-gaze,.aaa[data-reacting] .aaa-blink,.aaa[data-reacting] .aaa-eye{animation:none}
.aaa[data-reacting] .aaa-look{--aaa-look-x:0px;--aaa-look-y:0px;--aaa-look-sx:1}
.aaa[data-reacting] .aaa-head{--aaa-head-x:0px;--aaa-head-y:0px;--aaa-head-r:0deg}
.aaa[data-blink=off] .aaa-blink{animation:none}
.aaa[data-motion=off] *{animation:none!important}
.aaa[data-offscreen] *{animation-play-state:paused!important}
${blinks([3, 21, 47, 66, 88], 0.6)}
${glances(
  "aaa-saccade",
  [
    [0, 0, 0],
    [9, -4, -1],
    [22, 3, 2],
    [33, 5, -3],
    [41, 0, 0],
    [52, -5, -4],
    [61, 5, -4],
    [70, 0, 0],
    [78, -3, 3],
    [90, 2, -1],
    [100, 0, 0],
  ],
  1.2,
)}
${glances(
  "aaa-ponder",
  [
    [0, 0, 0],
    [8, -5, -4],
    [50, 5, -4],
    [92, 0, 0],
    [100, 0, 0],
  ],
  7,
)}
${glances(
  "aaa-read",
  [
    [0, -5, -2],
    [8, -2, -2],
    [16, 1, -2],
    [24, 4, -2],
    [33, -5, 0.5],
    [41, -2, 0.5],
    [49, 1, 0.5],
    [57, 4, 0.5],
    [66, -5, 3],
    [74, -2, 3],
    [82, 1, 3],
    [90, 4, 3],
    [100, -5, -2],
  ],
  2,
)}
${timeline("aaa-inspect", 6080, [
  [0, peek("0")],
  [880, peek("0")],
  [1280, peek(".55")],
  [1840, peek(".55")],
  [2000, peek("-.55")],
  [2580, peek("-.55")],
  [2720, peek("0")],
  [3480, peek("0")],
  [3620, peek(".55")],
  [4240, peek(".55")],
  [4420, peek("0")],
  [6080, peek("0")],
])}
${timeline("aaa-inspect-head", 6080, [
  [0, "translateY(0)"],
  [880, "translateY(0)"],
  [1280, "translateY(2.5px)"],
  [1840, "translateY(2.5px)"],
  [2000, "translateY(-2px)"],
  [2580, "translateY(-2px)"],
  [2720, "translateY(0)"],
  [6080, "translateY(0)"],
])}
${glances(
  "aaa-down",
  [
    [0, -2, 5],
    [30, 1, 5.5],
    [55, 3, 5],
    [70, 3, 5],
    [85, -1, 5.5],
    [100, -2, 5],
  ],
  8,
)}
${glances(
  "aaa-away",
  [
    [0, 6, 1.5],
    [40, 6, 2],
    [48, 5.5, -1],
    [72, 6, 1.5],
    [76, 0, 0],
    [84, 0, 0],
    [88, 6, 1.5],
    [100, 6, 1.5],
  ],
  1.5,
)}
${glances(
  "aaa-search",
  [
    [0, -5, -2],
    [10, 4, -3],
    [20, 4, -3],
    [26, -3, 2],
    [38, -3, 2],
    [44, 5, 1],
    [56, 5, 1],
    [62, -1, -4],
    [74, -1, -4],
    [80, -5, 3],
    [92, -5, 3],
    [100, -5, -2],
  ],
  2.5,
)}
@keyframes aaa-scan{0%{transform:${gazeTransform(-4, 1)};animation-timing-function:cubic-bezier(.45,.05,.55,.95)}70%{transform:${gazeTransform(4, 1)};animation-timing-function:${EASE_OUT}}80%,100%{transform:${gazeTransform(-4, 1)}}}
${orbit("aaa-orbit-l", -1)}
${orbit("aaa-orbit-r", 1)}
@keyframes aaa-heartbeat{0%,24%,48%,100%{transform:scale(1)}6%{transform:scale(1.155)}18%{transform:scale(1.093)}}
@keyframes aaa-drift{0%,100%{transform:translate(0,0) rotate(0deg) scale(1)}20%{transform:translate(4px,-3px) rotate(5deg) scale(1.02,.98)}45%{transform:translate(-2px,-5px) rotate(-3deg) scale(.98,1.02)}70%{transform:translate(-5px,-1px) rotate(-6deg) scale(1.02,.98)}85%{transform:translate(-1px,1px) rotate(2deg) scale(1)}}
@keyframes aaa-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes aaa-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes aaa-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035,.97)}}
@keyframes aaa-signal{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes aaa-acc-sway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
@keyframes aaa-wobble{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes aaa-glasses-think{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes aaa-snore{0%,100%{transform:scale(.7)}50%{transform:scale(1.1)}}
@keyframes aaa-nod{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(-3deg) translateY(1px)}}
@keyframes aaa-talk{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.4)}}
@keyframes aaa-caret{0%{opacity:1}50%{opacity:0}}
@media (prefers-reduced-motion:reduce){.aaa *{animation:none!important;transition:none!important}}
`;
