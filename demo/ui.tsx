import { type ReactNode, useState } from "react";

export const CARD =
  "rounded-[28px] border border-line bg-white/60 bg-[radial-gradient(var(--color-dot)_1px,transparent_1px)] bg-size-[18px_18px]";

export const BUTTON =
  "cursor-pointer whitespace-nowrap rounded-full border border-line bg-white px-3.5 py-1.5 text-[13px] text-ink hover:bg-chip active:translate-y-px";

export const DARK_BUTTON =
  "cursor-pointer whitespace-nowrap rounded-full bg-ink px-3.5 py-1.5 text-[13px] text-white hover:bg-knob active:translate-y-px";

export const FIELD =
  "rounded-xl border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus-visible:border-knob";

export const CODE_BLOCK =
  "overflow-x-auto rounded-2xl bg-ink p-5 font-mono text-[13px] leading-relaxed whitespace-pre text-[#e9eaec]";

export const PLAYING_RING =
  "data-playing:ring-2 data-playing:ring-[#b5603f] data-playing:ring-offset-2 data-playing:ring-offset-canvas";

export function Pill({
  children,
  playing = false,
  pressed,
  onClick,
}: {
  children: ReactNode;
  playing?: boolean;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={pressed}
      className={`cursor-pointer rounded-full border border-line bg-white px-3.5 py-1.5 font-mono text-[13px] text-chip-ink hover:bg-chip aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-white ${PLAYING_RING}`}
      data-playing={playing || undefined}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function Pills<T>({
  label,
  options,
  playing = false,
  value,
  onChange,
}: {
  label: (option: T) => string;
  options: readonly T[];
  playing?: boolean;
  value: T;
  onChange: (option: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Pill
          key={label(option)}
          playing={playing && option === value}
          pressed={option === value}
          onClick={() => onChange(option)}
        >
          {label(option)}
        </Pill>
      ))}
    </div>
  );
}

export function CopyButton({
  children = "Copy",
  className = BUTTON,
  text,
}: {
  children?: ReactNode;
  className?: string;
  text: string | (() => string);
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={className}
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
    >
      {copied ? "Copied" : children}
    </button>
  );
}

export function Switch({
  checked,
  children,
  onChange,
}: {
  checked: boolean;
  children: ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-2 pl-3.5 text-[13px] text-chip-ink select-none">
      {children}
      <input
        checked={checked}
        className="peer sr-only"
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="relative h-[18px] w-[30px] rounded-full bg-track transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.18)] after:transition-transform peer-checked:bg-knob peer-checked:after:translate-x-3 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-muted" />
    </label>
  );
}

export function Select<T extends string>({
  emptyLabel,
  label,
  options,
  playing = false,
  value,
  onChange,
}: {
  emptyLabel?: string;
  label: string;
  options: readonly T[];
  playing?: boolean;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <label
      className={`inline-flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-2 pl-3.5 text-[13px] text-subtle ${PLAYING_RING}`}
      data-playing={playing || undefined}
    >
      {label}
      <select
        className="cursor-pointer bg-transparent font-mono text-ink outline-none"
        value={value ?? ""}
        onChange={(event) => onChange((event.target.value || undefined) as T | undefined)}
      >
        {emptyLabel ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-xs tracking-widest text-subtle uppercase">{children}</div>;
}

export function SectionTitle({ eyebrow, title, aside }: { eyebrow: string; title: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="mt-2 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">{title}</h2>
      </div>
      {aside ? <p className="max-w-sm text-[15px] text-subtle">{aside}</p> : null}
    </div>
  );
}
