import { ACCESSORIES, EYES, FILLS, MOUTHS, SHAPES } from "../src/index.js";
import { type Look, PALETTES, randomAgentName } from "./look.js";
import { DARK_BUTTON, FIELD, Select, Switch } from "./ui.js";

const SLIDER =
  "inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] text-subtle";

export function Appearance({ look, onChange }: { look: Look; onChange: (patch: Partial<Look>) => void }) {
  function shuffle() {
    onChange({
      name: randomAgentName(look.name),
      shape: undefined,
      eyes: undefined,
      mouth: undefined,
      accessory: undefined,
    });
  }

  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h3 className="text-lg font-semibold">Appearance</h3>
      <div className="flex flex-wrap items-center gap-2">
        <input
          aria-label="Name"
          className={`${FIELD} min-w-48 flex-1`}
          value={look.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
        <button className={DARK_BUTTON} type="button" onClick={shuffle}>
          Shuffle
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select
          emptyLabel="auto"
          label="Shape"
          options={SHAPES}
          value={look.shape}
          onChange={(shape) => onChange({ shape })}
        />
        <Select
          emptyLabel="auto"
          label="Eyes"
          options={EYES}
          value={look.eyes}
          onChange={(eyes) => onChange({ eyes })}
        />
        <Select
          emptyLabel="none"
          label="Mouth"
          options={MOUTHS.filter((option) => option !== "none")}
          value={look.mouth}
          onChange={(mouth) => onChange({ mouth })}
        />
        <Select
          emptyLabel="none"
          label="Accessory"
          options={ACCESSORIES.filter((option) => option !== "none")}
          value={look.accessory}
          onChange={(accessory) => onChange({ accessory })}
        />
        <Select
          emptyLabel="auto"
          label="Fill"
          options={FILLS}
          value={look.fill}
          onChange={(fill) => onChange({ fill })}
        />
      </div>
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
        <label className={SLIDER}>
          Shading
          <input
            className="w-20 accent-knob"
            max={1}
            min={0}
            step={0.05}
            type="range"
            value={look.shading}
            onChange={(event) => onChange({ shading: Number(event.target.value) })}
          />
        </label>
        <label className={SLIDER}>
          Roundness
          <input
            aria-label="Frame roundness"
            className="w-20 accent-knob"
            disabled={!look.framed}
            max={0.5}
            min={0}
            step={0.01}
            type="range"
            value={look.radius}
            onChange={(event) => onChange({ radius: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Switch checked={look.framed} onChange={(framed) => onChange({ framed })}>
          Frame
        </Switch>
        <Switch
          checked={look.content === "initial"}
          onChange={(checked) => onChange({ content: checked ? "initial" : "face" })}
        >
          Initial
        </Switch>
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
    </section>
  );
}
