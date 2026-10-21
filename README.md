# aaavatars

Deterministic 2D character avatars for AI agents. Same name, same character. Its state is four [layers](#layers): `activity`, `expression` and `gaze` drive looping states, expressed through the eyes, and `play()` triggers one-shot reactions.

[Live demo](https://rsmdt.github.io/aaavatars/)

![aaavatars demo](https://raw.githubusercontent.com/rsmdt/aaavatars/main/docs/demo.gif)

```sh
npm install aaavatars
```

```tsx
import { Avatar, AvatarGroup, type AvatarHandle } from "aaavatars";

const avatar = useRef<AvatarHandle>(null);

<Avatar ref={avatar} name="Chief of Staff" size={36} activity="coding" label="Writing code" />;

await avatar.current?.play("success");
```

## Avatar

| Prop | Values |
|---|---|
| `name` | seed string |
| `frame` | `false` (no background), `0` (square) to `0.5` (circle) |
| `activity` | `idle`, `thinking`, `working`, `reading`, `searching`, `reviewing`, `coding`, `writing`, `waiting`, `asking`, `listening`, `speaking`, `stuck`, `sleeping` |
| `expression` | `neutral`, `happy`, `sad`, `angry`, `confused`, `curious`, `tired`, `love` |
| `gaze` | `follow` (pointer), `ponder`, `scan`, `read`, `wander`, `ahead`, `down`, `away`; defaults per activity |
| `shape` | `circle`, `squircle`, `pill`, `hex`, `triangle`, `drop`, `cloud`, `blob` |
| `eyes` | `round`, `dot`, `tall`, `wide` |
| `mouth` | `none`, `smile`, `flat`, `open`, or `renderMouth={(slot) => <svg element />}` |
| `accessory` | `none`, `antenna`, `sprout`, `hat`, `glasses`, `bowtie` |
| `content` | `face` or `initial` |
| `colors` / `body` / `background` | palette to pick from, or explicit hex colours |
| `fill` / `shading` | `solid` or `gradient`; soft-clay depth from `0` (flat, the default) to `1` |
| `src` | image URL, falls back to the character when it fails to load |
| `badge` | node pinned to the bottom-right corner |
| `label` | tooltip and accessible description of the current action |
| `blink` / `motion` | turn blinking or looping off |
| `interactive` | click, double-click, drag-to-squish and press-and-hold reactions |
| `onChange` | called with the event when one starts playing, from `play()` or an interactive reaction, and with `null` when it ends |

Unset `shape`, `eyes` and colours come from the name. `mouth` and `accessory` stay off until you set them.

With `shading` above `0`, the head is shaded like soft clay: a darker rim, a sheen that rolls with the gaze, and a soft contact shadow that stays put while the body bobs.

## Layers

A character's state is four independent layers. Each answers one question, and each can change without touching the others.

| Layer | Answers | Lasts | Set with |
|---|---|---|---|
| Activity | what is the agent doing? | until changed | `activity` prop |
| Expression | how does it feel? | until changed | `expression` prop |
| Gaze | where is it looking? | until changed | `gaze` prop, defaults per activity |
| Event | what just happened? | about 1 to 3 seconds, then back to rest | `play(event)` |

The eyes carry every layer, so a face without a mouth still reads. Each eye has a top and bottom lid, and its outline can morph into a glyph.

When two layers want the same part of the face, the more specific one wins:

1. An event owns the whole face while it plays. Glyph eyes morph back to round eyes for it, except `error`, which morphs them into `x x`, and return when it ends.
2. A non-`neutral` expression owns the eyes, the blinking and, when a mouth is set, the mouth.
3. The activity owns the body motion, the accessory motion and, while the expression is `neutral`, the eye pose and the mouth.
4. The gaze moves where the eyes point. It never changes their shape.

`sleeping` is the one exception: it keeps the eyes closed whatever the expression.

### Activity

An activity is the body language of a task. It is not a combination of an expression and a gaze. It sets the body's motion, picks a default gaze, and, only while the expression is `neutral`, may give the eyes their own pose: a glyph, a lid shape or a loop. It never sets an emotion, so `activity="coding" expression="happy"` is a happy coder, with the happy eyes replacing the `>_` until the expression returns to `neutral`.

| Activity | Body | Eyes, with a `neutral` expression | Default gaze |
|---|---|---|---|
| `idle` | slow drift | | `follow` |
| `thinking` | sway | | `ponder` |
| `working` | quick bob | | `scan` |
| `reading` | still | | `read` |
| `searching` | leans in | dart in short jumps and hold, looking for something | `ahead` |
| `reviewing` | head dips with the eyes | narrow to a slit, look down, up, back, then down once more; a 6s loop | `ahead` |
| `coding` | bob | morph into a sharp `>_` prompt with a blinking cursor | `ahead` |
| `writing` | slow bob | | `read` |
| `waiting` | still | settle to the centre, then circle around each other twice every 3.2s | `ahead` |
| `asking` | head tilted | still, one eye wider: the person's turn to answer or approve | `ahead` |
| `listening` | nod | slide together into one tall blinking cursor | `ahead` |
| `speaking` | bob, mouth talks | | `follow` |
| `stuck` | tilted | sweep side to side once, then morph into sharp `x x` crosses | `ahead` |
| `sleeping` | breathe, sunk | droop, catch themselves once, droop again and close. Leaving it wakes them: half-open, wide, back to rest | `ahead` |

### Expression

An expression is a mood that can last for minutes, shown through the lids and, when set, the mouth. A feeling that only makes sense for a moment, like surprise, is an event instead, so no value belongs to both layers.

| Expression | Eyes |
|---|---|
| `neutral` | the activity's eyes |
| `happy` | bottom lids raised |
| `sad` | top lids down, tilted outward |
| `angry` | top lids down, tilted inward |
| `confused` | one lid lowered |
| `curious` | both eyes slightly wider |
| `tired` | heavy top lids, drooping outward |
| `love` | both eyes tilt together into one beating heart |

### Gaze

A gaze is a pattern of where to look. It works with any activity and any eye shape, and only moves the eyes. A loop that also needs the lids or the head, like `reviewing` or `waiting`, belongs to the activity instead.

| Gaze | Eyes |
|---|---|
| `follow` | follow a mouse or pen anywhere on the page while it moves, then return to glancing 0.9s after it stops |
| `wander` | glance around and hold, ignoring the pointer |
| `ponder` | look up-left, then up-right, then back |
| `scan` | sweep across: slow right, quick jump back |
| `read` | read line by line: three short hops right, jump back and down a line, three lines, then back to the top |
| `ahead` | look straight out |
| `down` | look down at the work, drifting a little side to side |
| `away` | look off to the side, with a brief check-in straight ahead |

### Event

An event is a one-off reaction. `play(event)` resolves when the animation ends. Each reaction first centres the eyes and settles for half a second, except when triggered by a click or press.

An event does not change the `activity`, `expression` or `gaze` props. `EVENT_LAYERS[event]` names the expression and gaze it shows while it plays, for example `success` shows `happy` eyes looking `ahead`. Pair it with `onChange` to mirror the face in your own UI.

| Event | Reaction |
|---|---|
| `acknowledge` | a double nod of the eyes |
| `handoff` | eyes and body lean to the side, then return |
| `success` | happy eyes with a long bounce |
| `warning` | a wince: the eyes shift aside, heavy lids press down twice, the head dips and rises |
| `error` | the eyes morph into `x x` crosses, then the head and eyes sink, hold, and recover |
| `surprised` | a squint, then wide eyes with a tremble |
| `sigh` | a small breath in, then the lids sink and the head slumps before it recovers |
| `yawn` | the head stretches tall while the eyes close, then a blink awake |

Under `prefers-reduced-motion`, or while the page is hidden, `play()` resolves immediately.

### Rendering

Each name blinks, glances and loops at its own tempo and phase, in CSS only. The `follow` gaze uses one shared pointer listener, updated once per frame. Offscreen avatars pause their loops. The glyphs (`>_`, `x x`, the cursor) are the eyes themselves, morphing their outline: smoothly in Chrome and Firefox, as an instant swap in Safari, which does not animate the SVG `d` property.

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

```sh
npm run dev        # playground
npm test
npm run build
```
