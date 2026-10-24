import { useState } from "react";

import { CODE_BLOCK, CopyButton, Pills, SectionTitle } from "./ui.js";

const INSTALL = {
  npm: "npm install aaavatars",
  pnpm: "pnpm add aaavatars",
  yarn: "yarn add aaavatars",
  bun: "bun add aaavatars",
};

type Manager = keyof typeof INSTALL;

const RENDER = `import { Avatar } from "aaavatars";

<Avatar
  name="Research"
  blink
  loop
  activity="coding"
  expression="happy"
  gaze="follow"
  frame={0.5}
/>`;

const PLAY = `import { Avatar, type AvatarHandle } from "aaavatars";

const avatar = useRef<AvatarHandle>(null);

<Avatar ref={avatar} name="Research" />;

await avatar.current?.play("success");`;

const SVG = `import { renderAvatarSvg } from "aaavatars/server";

const svg = renderAvatarSvg({ name: "Research", size: 128 });`;

function Step({ code, index, text, title }: { code: string; index: number; text: string; title: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-subtle">{String(index).padStart(2, "0")}</span>
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto">
          <CopyButton text={code} />
        </span>
      </div>
      <p className="text-sm text-subtle">{text}</p>
      <pre className={`${CODE_BLOCK} flex-1`}>{code}</pre>
    </div>
  );
}

export function Install() {
  const [manager, setManager] = useState<Manager>("npm");
  return (
    <section>
      <SectionTitle eyebrow="Install" title="Up and running in a minute." />
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-subtle">01</span>
            <h3 className="font-semibold">Add the package</h3>
          </div>
          <Pills
            label={(option) => option}
            options={Object.keys(INSTALL) as Manager[]}
            value={manager}
            onChange={setManager}
          />
          <div className={`${CODE_BLOCK} flex items-center gap-3`}>
            <span className="text-muted">$</span>
            <span className="flex-1">{INSTALL[manager]}</span>
            <CopyButton text={INSTALL[manager]} />
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-2 lg:[&>:last-child]:col-span-2">
          <Step
            code={RENDER}
            index={2}
            text="Set what it's doing and how it feels."
            title="Render a face"
          />
          <Step
            code={PLAY}
            index={3}
            text="Call play() for a one-off reaction. Await it to know when it's done."
            title="Play an event"
          />
          <Step
            code={SVG}
            index={4}
            text="Render a static SVG on the server. Requires react-dom."
            title="Static SVG"
          />
        </div>
      </div>
    </section>
  );
}
