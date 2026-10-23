# aaavatars

Deterministic 2D character avatars for AI agents. Same name, same character. The eyes show what the agent is doing, how it feels, where it looks and what just happened.

[Live demo](https://rsmdt.github.io/aaavatars/)

![aaavatars demo](https://raw.githubusercontent.com/rsmdt/aaavatars/main/docs/demo.gif)

```sh
npm install aaavatars
```

```tsx
import { Avatar, type AvatarHandle } from "aaavatars";

const avatar = useRef<AvatarHandle>(null);

<Avatar ref={avatar} name="Chief of Staff" frame={0.5} blink loop activity="coding" />;

await avatar.current?.play("success");
```

## Avatar

| Prop | Values |
|---|---|
| `name` | seed string |
| `activity` / `expression` / `gaze` | see [Layers](#layers) |
| `frame` | background from `0` (square) to `0.5` (circle) |
| `blink` / `loop` | blinking and the looping animations |
| `interactive` | click, double-click, drag-to-squish and press-and-hold reactions |
| `shape` | `circle`, `squircle`, `pill`, `hex`, `triangle`, `drop`, `cloud`, `blob` |
| `eyes` | `round`, `dot`, `tall`, `wide` |
| `mouth` | `none`, `smile`, `flat`, `open`, or `renderMouth={(slot) => <svg element />}` |
| `accessory` | `none`, `antenna`, `sprout`, `hat`, `glasses`, `bowtie` |
| `content` | `face` or `initial` |
| `colors` / `body` / `background` | palette to pick from, or explicit hex colours |
| `fill` | `solid` or `gradient` |
| `shading` | soft-clay depth from `0` to `1` |
| `src` | image URL, falls back to the character when it fails to load |
| `dot` | `true` for a bottom-right dot in the accent colour, or a colour for the dot |
| `label` | tooltip and accessible description |
| `onChange` | called with an event when it starts playing, and `null` when it ends |

`frame`, `blink`, `loop`, `interactive`, `mouth`, `accessory`, `shading` and `dot` are off until you set them. Unset `shape`, `eyes` and colours come from the name.

## Layers

| Layer | Answers | Set with |
|---|---|---|
| Activity | what is it doing? | `activity` |
| Expression | how does it feel? | `expression` |
| Gaze | where is it looking? | `gaze`, defaults per activity |
| Event | what just happened? | `play(event)`, lasts 1 to 3 seconds |

Each layer changes without touching the others. While an event plays it owns the face. Otherwise a non-`neutral` expression owns the eyes, the activity owns the body, and the gaze only moves where the eyes point.

### Activity

| Activity | Body | Eyes, while `neutral` | Gaze |
|---|---|---|---|
| `idle` | slow drift | | `follow` |
| `busy` | turns away, then folds into three pulsing dots, and turns back round when it ends | | `ahead` |
| `done` | turns away and folds into a check mark | | `ahead` |
| `attention` | turns away and folds into a `!` | | `ahead` |
| `thinking` | sway | | `ponder` |
| `reading` | still | | `read` |
| `searching` | leans in | dart and hold | `ahead` |
| `reviewing` | head dips | narrow, look down and up | `ahead` |
| `coding` | bob | a `>_` prompt with a blinking cursor | `ahead` |
| `writing` | slow bob | | `read` |
| `asking` | turns away and folds into a `?` | | `ahead` |
| `listening` | turns away and folds into bouncing sound bars | | `ahead` |
| `speaking` | bob, mouth talks | | `follow` |
| `error` | tilted | sweep, then `x x` | `ahead` |
| `sleeping` | breathe, sunk | droop and close, whatever the expression | `ahead` |

### Expression

| Expression | Eyes |
|---|---|
| `neutral` | the activity's eyes |
| `happy` | smiling `∩ ∩` arcs |
| `sad` | top lids down, tilted outward |
| `angry` | top lids down, tilted inward |
| `confused` | one lid lowered |
| `curious` | both eyes slightly wider |
| `tired` | heavy top lids |
| `love` | one beating heart |

### Gaze

| Gaze | Eyes |
|---|---|
| `follow` | follow the pointer anywhere on the page |
| `wander` | glance around, ignoring the pointer |
| `ponder` | look up-left, then up-right |
| `scan` | sweep right, jump back |
| `read` | read line by line |
| `ahead` | look straight out |
| `down` | look down at the work |
| `away` | look off to the side |

### Event

`play(event)` resolves when the reaction ends, or immediately under `prefers-reduced-motion`. It does not change the props. `EVENT_LAYERS[event]` names the expression and gaze it shows, for example `sigh` shows `tired` eyes looking `ahead`. `success` and `handoff` turn the avatar into a glyph and resolve once it has turned back.

| Event | Reaction |
|---|---|
| `acknowledge` | a double nod |
| `handoff` | folds into a dot that slides out to the right and back in from the left |
| `success` | folds into a check mark |
| `warning` | a wince |
| `error` | `x x` eyes, then sink and recover |
| `surprised` | a squint, then wide eyes |
| `sigh` | breathe in, then slump |
| `yawn` | stretch tall with closed eyes |

## AvatarGroup

```tsx
<AvatarGroup max={4} size={28} members={[{ name: "Ada", content: "initial" }, { name: "Research" }]} />
```

## Static SVG

```ts
import { renderAvatarSvg } from "aaavatars/server";

const svg = renderAvatarSvg({ name: "Research", size: 128 });
```

Requires `react-dom`.

## Development

```sh
npm run dev
npm test
npm run build
```
