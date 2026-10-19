import { type ReactNode, useRef } from "react";

import {
  ACCESSORIES,
  Avatar,
  type AvatarHandle,
  AvatarGroup,
  EYES,
  FILLS,
  MOUTHS,
  SHAPES,
  formatAvatarValue,
} from "../src/index.js";
import { renderAvatarSvg } from "../src/server.js";
import { DEFAULT_LOOK, type Look, NAMES, PALETTES, liveProps, lookProps } from "./look.js";
import { CARD, CopyButton, DARK_BUTTON, FIELD, Pills, SectionTitle, Switch } from "./ui.js";

function Row({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <div className="mb-2 font-mono text-xs tracking-widest text-subtle uppercase">{label}</div>
      {children}
    </div>
  );
}

function withAuto<T>(options: readonly T[]): (T | undefined)[] {
  return [undefined, ...options];
}

function withNone<T extends string>(options: readonly T[]): (T | undefined)[] {
  return [undefined, ...options.filter((option) => option !== "none")];
}

export function Builder({ look, onChange }: { look: Look; onChange: (patch: Partial<Look>) => void }) {
  const avatar = useRef<AvatarHandle>(null);
  const props = lookProps(look);
  const value = formatAvatarValue({
    shape: look.shape,
    eyes: look.eyes,
    mouth: look.mouth,
    accessory: look.accessory,
    fill: look.fill,
  });
  const frame = props.frame;

  function shuffle() {
    const others = NAMES.filter((candidate) => candidate !== look.name);
    onChange({
      name: others[Math.floor(Math.random() * others.length)] as string,
      shape: undefined,
      eyes: undefined,
      mouth: undefined,
      accessory: undefined,
    });
    void avatar.current?.play("surprised");
  }

  return (
    <section>
      <SectionTitle
        aside="Name it, colour it, dress it up. The same name always draws the same character. Click it, drag it, press and hold it."
        eyebrow="Make your own"
        title="Say hello to yours."
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`${CARD} flex flex-col items-center gap-4 self-start p-8 lg:sticky lg:top-6`}>
          <div className="grid min-h-[240px] place-items-center">
            <Avatar ref={avatar} {...liveProps(look)} size={160} />
          </div>
          <div className="text-xl font-semibold">{props.name}</div>
          <div className="flex w-full items-center gap-2 rounded-xl border border-line bg-white py-1.5 pr-1.5 pl-3">
            <code className="min-w-0 flex-1 truncate font-mono text-[13px]">
              {value || "(all from name)"}
            </code>
            <CopyButton text={value} />
          </div>
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <AvatarGroup
              max={6}
              members={[
                { name: "Rudolf", content: "initial", colors: ["#E1E2E5", "#5F646C"], frame },
                ...NAMES.map((member) => ({
                  name: member,
                  colors: props.colors,
                  fill: look.fill,
                  frame,
                  shading: look.shading,
                })),
              ]}
              size={30}
            />
            <CopyButton text={() => renderAvatarSvg({ ...props, size: 256 })}>Copy SVG</CopyButton>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Row label="Name">
            <div className="flex gap-2">
              <input
                aria-label="Name"
                className={`${FIELD} flex-1`}
                value={look.name}
                onChange={(event) => onChange({ name: event.target.value })}
              />
              <button className={DARK_BUTTON} type="button" onClick={shuffle}>
                Shuffle
              </button>
            </div>
          </Row>
          <Row label="Colours">
            <div className="flex flex-wrap items-center gap-2">
              {PALETTES.map((swatches, index) => (
                <button
                  key={swatches.join()}
                  aria-label={`Palette ${index + 1}`}
                  aria-pressed={look.palette === index}
                  className="flex cursor-pointer rounded-full border border-line bg-white p-1.5 aria-pressed:ring-2 aria-pressed:ring-ink"
                  type="button"
                  onClick={() => onChange({ palette: index })}
                >
                  {swatches.map((color) => (
                    <i
                      key={color}
                      className="h-[18px] w-3 first:rounded-l-full last:rounded-r-full"
                      style={{ background: color }}
                    />
                  ))}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Fill">
            <div className="flex flex-wrap items-center gap-3">
              <Pills
                label={(option) => option ?? "auto"}
                options={withAuto(FILLS)}
                value={look.fill}
                onChange={(fill) => onChange({ fill })}
              />
              <label className="inline-flex items-center gap-2 text-[13px] text-subtle">
                Shading
                <input
                  className="w-28 accent-knob"
                  max={1}
                  min={0}
                  step={0.05}
                  type="range"
                  value={look.shading}
                  onChange={(event) => onChange({ shading: Number(event.target.value) })}
                />
              </label>
            </div>
          </Row>
          <Row label="Shape">
            <Pills
              label={(option) => option ?? "auto"}
              options={withAuto(SHAPES)}
              value={look.shape}
              onChange={(shape) => onChange({ shape })}
            />
          </Row>
          <Row label="Eyes">
            <Pills
              label={(option) => option ?? "auto"}
              options={withAuto(EYES)}
              value={look.eyes}
              onChange={(eyes) => onChange({ eyes })}
            />
          </Row>
          <Row label="Mouth">
            <Pills
              label={(option) => option ?? "none"}
              options={withNone(MOUTHS)}
              value={look.mouth}
              onChange={(mouth) => onChange({ mouth })}
            />
          </Row>
          <Row label="Accessory">
            <Pills
              label={(option) => option ?? "none"}
              options={withNone(ACCESSORIES)}
              value={look.accessory}
              onChange={(accessory) => onChange({ accessory })}
            />
          </Row>
          <Row label="Frame">
            <div className="flex flex-wrap items-center gap-3">
              <Switch checked={look.framed} onChange={(framed) => onChange({ framed })}>
                Frame
              </Switch>
              <label className="inline-flex items-center gap-2 text-[13px] text-subtle">
                Square
                <input
                  aria-label="Frame roundness"
                  className="w-32 accent-knob"
                  disabled={!look.framed}
                  max={0.5}
                  min={0}
                  step={0.01}
                  type="range"
                  value={look.radius}
                  onChange={(event) => onChange({ radius: Number(event.target.value) })}
                />
                Circle
              </label>
              <Switch
                checked={look.content === "initial"}
                onChange={(checked) => onChange({ content: checked ? "initial" : "face" })}
              >
                Initial
              </Switch>
            </div>
          </Row>
          <Row label="Behaviour">
            <div className="flex flex-wrap gap-2">
              <Switch checked={look.blink} onChange={(blink) => onChange({ blink })}>
                Blink
              </Switch>
              <Switch checked={look.motion} onChange={(motion) => onChange({ motion })}>
                Loop
              </Switch>
              <Switch checked={look.interactive} onChange={(interactive) => onChange({ interactive })}>
                Interactive
              </Switch>
              <Switch checked={look.badge} onChange={(badge) => onChange({ badge })}>
                Badge
              </Switch>
              <Switch checked={look.spinner} onChange={(spinner) => onChange({ spinner })}>
                Spinner mouth
              </Switch>
            </div>
          </Row>
          <Row label="Label and image">
            <div className="flex flex-wrap gap-2">
              <input
                aria-label="Label"
                className={`${FIELD} flex-1`}
                placeholder="Searching the web…"
                value={look.label}
                onChange={(event) => onChange({ label: event.target.value })}
              />
              <input
                aria-label="Image URL"
                className={`${FIELD} flex-1`}
                placeholder="https://…"
                value={look.src}
                onChange={(event) => onChange({ src: event.target.value })}
              />
            </div>
          </Row>
          <div>
            <button
              className="cursor-pointer text-[13px] text-subtle underline underline-offset-4 hover:text-ink"
              type="button"
              onClick={() =>
                onChange({
                  ...DEFAULT_LOOK,
                  accessory: undefined,
                  eyes: undefined,
                  fill: undefined,
                  mouth: undefined,
                  name: look.name,
                  shape: undefined,
                })
              }
            >
              Reset everything but the name
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
