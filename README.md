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

<Avatar ref={avatar} name="Chief of Staff" activity="coding" />;

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

### Activity

| Activity | Signals |
|---|---|
| `idle` | nothing to do |
| `busy` | working, shows pulsing dots |
| `done` | finished, shows a check mark |
| `attention` | needs you, shows a `!` |
| `thinking` | reasoning |
| `reading` | reading input |
| `searching` | looking something up |
| `reviewing` | checking work |
| `coding` | writing code |
| `writing` | writing text |
| `asking` | has a question, shows a `?` |
| `listening` | taking voice input, shows sound bars |
| `speaking` | talking |
| `error` | something failed |
| `sleeping` | inactive |

### Expression

`neutral`, `happy`, `sad`, `angry`, `confused`, `curious`, `tired`, `love`

### Gaze

`follow` (the pointer), `wander`, `ponder`, `scan`, `read`, `ahead`, `down`, `away`

### Event

`await play(event)` resolves when the reaction ends, or immediately with reduced motion.

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

`members` takes Avatar props. The group fills at most `max` slots (default `4`), the last one a `+N` bubble when there are more members. `size` defaults to `32`, `overlap` is a fraction of the size (default `0.3`), and `ringColor` outlines framed avatars (default white).

## Static SVG

```ts
import { renderAvatarSvg } from "aaavatars/server";

const svg = renderAvatarSvg({ name: "Research", size: 128 });
```

Requires `react-dom`.

