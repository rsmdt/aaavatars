import { ACCESSORIES, EYES, FILLS, MOUTHS, SHAPES } from "../src/index.js";
import { type Look, PALETTES } from "./look.js";
import { SLIDER, Select, Switch } from "./ui.js";

export function Appearance({ look, onChange }: { look: Look; onChange: (patch: Partial<Look>) => void }) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-6">
      <h3 className="text-lg font-semibold">Appearance</h3>
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
            step={0.2}
            type="range"
            value={look.shading}
            onChange={(event) => onChange({ shading: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </section>
  );
}
