import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { Avatar } from "../src/index.js";
import packageJson from "../package.json" with { type: "json" };
import { Builder } from "./Builder.js";
import { Install } from "./Install.js";
import { DEFAULT_LOOK, type Look } from "./look.js";
import { Playground } from "./Playground.js";
import { LovedByBots, WhyAFace } from "./Stories.js";

const REPOSITORY = "https://github.com/rsmdt/aaavatars";

function Demo() {
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-28 px-6 pt-6 pb-16">
      <div className="flex flex-col gap-12">
        <header className="flex items-center gap-3">
          <Avatar frame={0.3} name="aaavatars" size={30} />
          <span className="font-semibold">aaavatars</span>
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[11px] text-subtle">
            demo {packageJson.version}
          </span>
          <a
            className="ml-auto text-sm text-subtle underline-offset-4 hover:text-ink hover:underline"
            href={REPOSITORY}
          >
            GitHub
          </a>
        </header>

        <div className="text-center">
          <h1 className="mx-auto max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
            Give your agent a face people want to meet.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-subtle">
            What it's doing, how it feels, where it looks, and what just happened. Each layer changes
            on its own, and the eyes carry all four, so the face still reads with no mouth at all.
          </p>
        </div>

        <Playground look={look} />
      </div>

      <WhyAFace />
      <LovedByBots />
      <Builder look={look} onChange={(patch) => setLook((current) => ({ ...current, ...patch }))} />
      <Install />

      <footer className="flex flex-wrap gap-4 border-t border-line pt-6 text-sm text-subtle">
        <span>aaavatars {packageJson.version} · MIT</span>
        <a className="ml-auto hover:text-ink" href={`${REPOSITORY}#readme`}>
          README
        </a>
        <a className="hover:text-ink" href={REPOSITORY}>
          GitHub
        </a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
