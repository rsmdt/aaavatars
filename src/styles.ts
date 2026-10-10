export const AVATAR_CSS = `
.aaa-body-motion,.aaa-react,.aaa-eyes-react,.aaa-eyes-motion,.aaa-blink,.aaa-squish{transform-box:fill-box;transform-origin:center}
.aaa-mouth-rest,.aaa-mood{transform-box:fill-box;transform-origin:center;transition:opacity .2s,transform .2s}
.aaa-mood{opacity:0}
.aaa-accessory{transform-box:fill-box;transform-origin:50% 100%;transition:transform .3s ease-out}
.aaa-accessory[data-accessory=glasses],.aaa-accessory[data-accessory=bowtie]{transform-origin:center}
.aaa-squish{transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.aaa-squish[data-dragging]{transition:none}
.aaa[data-interactive]{cursor:grab;touch-action:none}
.aaa[data-interactive]:active{cursor:grabbing}
.aaa-look{transform:translate(var(--aaa-look-x,0px),var(--aaa-look-y,0px));transition:transform .25s ease-out}
.aaa-blink{animation:aaa-blink 4.6s infinite}
.aaa[data-status=idle] .aaa-body-motion{animation:aaa-bob 3.6s ease-in-out infinite}
.aaa[data-status=thinking] .aaa-body-motion{animation:aaa-sway 3s ease-in-out infinite}
.aaa[data-status=thinking] .aaa-eyes-motion{transform:translate(-5px,-6px);animation:aaa-ponder 2.4s ease-in-out infinite}
.aaa[data-status=working] .aaa-body-motion{animation:aaa-bob .9s ease-in-out infinite}
.aaa[data-status=working] .aaa-eyes-motion{animation:aaa-scan 1.1s ease-in-out infinite}
.aaa[data-status=waiting] .aaa-body-motion{animation:aaa-hop 1.6s ease-out infinite}
.aaa[data-status=waiting] .aaa-eyes-motion{transform:scale(1.18)}
.aaa[data-status=error] .aaa-body-motion{transform:rotate(-10deg)}
.aaa[data-status=error] .aaa-eyes-motion{transform:scaleY(.25)}
.aaa[data-status=error] .aaa-blink{animation:none}
.aaa[data-status=sleeping] .aaa-body-motion{animation:aaa-breathe 4.2s ease-in-out infinite}
.aaa[data-status=sleeping] .aaa-eyes-motion{transform:translateY(2px) scaleY(.12)}
.aaa[data-status=sleeping] .aaa-blink{animation:none}
.aaa[data-status=working] .aaa-antenna-tip{animation:aaa-signal .9s ease-in-out infinite}
.aaa[data-status=thinking] .aaa-mouth-rest{opacity:0}
.aaa[data-status=thinking] .aaa-mood-small{opacity:1}
.aaa[data-status=thinking] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){animation:aaa-acc-sway 2.4s ease-in-out infinite}
.aaa[data-status=thinking] .aaa-accessory[data-accessory=glasses]{animation:aaa-glasses-think 2.4s ease-in-out infinite}
.aaa[data-status=working] .aaa-mouth-rest{transform:scaleX(.7)}
.aaa[data-status=working] .aaa-accessory[data-accessory=bowtie]{animation:aaa-wobble .9s ease-in-out infinite}
.aaa[data-status=waiting] .aaa-mouth-rest{opacity:0}
.aaa[data-status=waiting] .aaa-mood-happy{opacity:1}
.aaa[data-status=waiting] .aaa-accessory:not([data-accessory=glasses]){animation:aaa-wobble 1.6s ease-in-out infinite}
.aaa[data-status=error] .aaa-mouth-rest{opacity:0}
.aaa[data-status=error] .aaa-mood-sad{opacity:1}
.aaa[data-status=error] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){transform:rotate(28deg)}
.aaa[data-status=error] .aaa-accessory:is([data-accessory=hat],[data-accessory=glasses]){transform:translateY(3px) rotate(8deg)}
.aaa[data-status=error] .aaa-accessory[data-accessory=bowtie]{transform:rotate(18deg)}
.aaa[data-status=sleeping] .aaa-mouth-rest{opacity:0}
.aaa[data-status=sleeping] .aaa-mood-o{opacity:1;animation:aaa-snore 4.2s ease-in-out infinite}
.aaa[data-status=sleeping] .aaa-accessory:is([data-accessory=antenna],[data-accessory=sprout]){transform:rotate(-35deg)}
.aaa[data-status=sleeping] .aaa-accessory:is([data-accessory=hat],[data-accessory=glasses]){transform:translateY(5px)}
.aaa[data-blink=off] .aaa-blink{animation:none}
.aaa[data-motion=off] *{animation:none!important}
@keyframes aaa-blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.1)}}
@keyframes aaa-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes aaa-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes aaa-ponder{0%,100%{transform:translate(-5px,-6px)}50%{transform:translate(5px,-6px)}}
@keyframes aaa-scan{0%,100%{transform:translateX(-5px)}50%{transform:translateX(5px)}}
@keyframes aaa-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035,.97)}}
@keyframes aaa-signal{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes aaa-acc-sway{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg)}}
@keyframes aaa-wobble{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes aaa-glasses-think{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes aaa-snore{0%,100%{transform:scale(.7)}50%{transform:scale(1.1)}}
@keyframes aaa-hop{0%,55%,100%{transform:translateY(0)}68%{transform:translateY(-7px)}80%{transform:translateY(0)}90%{transform:translateY(-3px)}}
@media (prefers-reduced-motion:reduce){.aaa *{animation:none!important;transition:none!important}}
`;
