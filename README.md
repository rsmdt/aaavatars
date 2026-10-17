# aaavatars

Deterministic 2D character avatars for AI agents. Same name, same character. `activity`, `expression` and `gaze` drive looping states, expressed through the eyes, and `play()` triggers one-shot reactions.

[Live demo](https://rsmdt.github.io/aaavatars/)

![aaavatars demo](https://raw.githubusercontent.com/rsmdt/aaavatars/main/docs/demo.gif)

```sh
npm install aaavatars
```

```tsx
import { Avatar, AvatarGroup, type AvatarHandle, parseAvatarValue } from "aaavatars";

const avatar = useRef<AvatarHandle>(null);

<Avatar ref={avatar} name="Chief of Staff" size={36} activity="coding" label="Writing code" />;

await avatar.current?.play("done");
```

## Avatar

| Prop | Values |
|---|---|
| `name` | seed string |
| `frame` | `false` (no background), `0` (square) to `0.5` (circle) |
| `activity` | `idle`, `thinking`, `working`, `reading`, `coding`, `waiting`, `asking`, `listening`, `speaking`, `error`, `sleeping` |
| `expression` | `neutral`, `happy`, `sad`, `angry`, `surprised`, `confused`, `love` |
| `gaze` | `follow` (pointer), `ponder`, `scan`, `read`, `wander`, `ahead`; defaults per activity |
| `shape` | `circle`, `squircle`, `pill`, `hex`, `triangle`, `drop`, `cloud`, `blob` |
| `eyes` | `round`, `dot`, `tall`, `wide` |
| `mouth` | `none`, `smile`, `flat`, `open`, or `renderMouth={(slot) => <svg element />}` |
| `accessory` | `none`, `antenna`, `sprout`, `hat`, `glasses`, `bowtie` |
| `content` | `face` or `initial` |
| `colors` / `body` / `background` | palette to pick from, or explicit hex colours |
| `fill` / `shading` | `solid` or `gradient`; `0` to `1` |
| `src` | image URL, falls back to the character when it fails to load |
| `badge` | node pinned to the bottom-right corner |
| `label` | tooltip and accessible description of the current action |
| `blink` / `motion` | turn blinking or looping off |
| `interactive` | click, double-click, drag-to-squish and press-and-hold reactions |

Unset `shape`, `eyes` and colours come from the name. `mouth` and `accessory` stay off until you set them. Each name blinks, glances and loops at its own tempo and phase, in CSS only.

The eyes carry every state, so a face without a mouth still reads. Each eye has a top and bottom lid:

| State | Eyes |
|---|---|
| `idle` | glance around and hold, follow the pointer while it moves, return to glancing 0.9s after it stops |
| `thinking` | look up-left, then up-right, then back |
| `working` | read: slow sweep right, quick jump back |
| `reading` | read line by line: three short hops right, jump back and down a line, three lines, then back to the top |
| `coding` | morph into a sharp `>_` prompt with a blinking cursor |
| `waiting` | settle to the centre, then circle around each other twice every 3.2s |
| `asking` | hold still and look straight out, one eye wider, head tilted: the person's turn to answer or approve |
| `error` | sweep side to side once while turning into sharp `x x` crosses |
| `sleeping` | droop, catch themselves once, droop again and close while the head sinks; leaving it plays `wake` |
| `happy` / `sad` / `angry` | bottom lid raised / top lids down tilted outward / top lids down tilted inward |
| `surprised` / `confused` / `love` | wide / one lid lowered / both eyes tilt together into one beating heart |

A non-neutral `expression` overrides the activity's eyes and, when a mouth is set, its mouth. With `gaze="follow"`, the eyes and the head follow a mouse or pen anywhere on the page through one shared listener, updated once per frame. Offscreen avatars pause their loops.

`play(event)` accepts `acknowledge`, `handoff`, `done`, `success`, `failure`, `surprise`, `blocked`, `love`, `wake` and resolves when the animation ends. Each reaction first centres the eyes and settles for half a second, except when triggered by a click or press. Under `prefers-reduced-motion`, or while the page is hidden, it resolves immediately.

## AvatarGroup

```tsx
<AvatarGroup max={4} size={28} members={[{ name: "Ada", content: "initial" }, { name: "Research" }]} />
```

## Stored value

`formatAvatarValue({ shape: "hex", accessory: "hat" })` gives `shape=hex;accessory=hat`. `parseAvatarValue(text)` returns `{ ok: true, value }` to spread onto `<Avatar>`, or `{ ok: false, error }` naming the invalid field.

## Static SVG

```ts
import { renderAvatarSvg } from "aaavatars/server";

const svg = renderAvatarSvg({ name: "Research", size: 128 });
```

Requires `react-dom`.

```sh
npm run dev        # playground
npm test
npm run build
```
