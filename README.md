# aaavatars

Deterministic 2D character avatars for AI agents. Same name, same character. A `status` prop drives looping states and `play()` triggers one-shot reactions.

```tsx
import { Avatar, AvatarGroup, type AvatarHandle, parseAvatarValue } from "aaavatars";

const avatar = useRef<AvatarHandle>(null);

<Avatar ref={avatar} name="Chief of Staff" size={36} status="working" label="Searching the web" />;

await avatar.current?.play("done");
```

## Avatar

| Prop | Values |
|---|---|
| `name` | seed string |
| `frame` | `false` (no background), `0` (square) to `0.5` (circle) |
| `status` | `idle`, `thinking`, `working`, `waiting`, `error`, `sleeping` |
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
| `blink` / `look` / `motion` | turn blinking, pointer following or looping off |
| `interactive` | click, double-click, drag-to-squish and press-and-hold reactions |

Unset `shape`, `eyes`, `mouth`, `accessory` and colours come from the name.

`play(event)` accepts `acknowledge`, `handoff`, `done`, `success`, `failure`, `surprise`, `wake` and resolves when the animation ends. Under `prefers-reduced-motion`, or while the page is hidden, it resolves immediately.

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
