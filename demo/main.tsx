import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { Avatar } from "../src/index.js";
import { Install } from "./Install.js";
import { DEFAULT_LOOK, type Look } from "./look.js";
import { Playground } from "./Playground.js";
import { LovedByBots, WhyAFace } from "./Stories.js";

const REPOSITORY = "https://github.com/rsmdt/aaavatars";

function Demo() {
  const [look, setLook] = useState<Look>(DEFAULT_LOOK);
  const changeLook = (patch: Partial<Look>) => setLook((current) => ({ ...current, ...patch }));

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-28 px-6 pt-6 pb-16">
      <div className="flex flex-col gap-12">
        <header className="flex items-center gap-3">
          <Avatar frame={0.3} name="aaavatars" size={30} />
          <span className="font-semibold">aaavatars</span>
          <a aria-label="GitHub" className="ml-auto text-subtle hover:text-ink" href={REPOSITORY}>
            <svg aria-hidden="true" className="size-6" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </header>

        <div className="text-center">
          <h1 className="mx-auto max-w-4xl text-5xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
            Give your agent a face people want to meet.
          </h1>
        </div>

        <Playground look={look} onLookChange={changeLook} />
      </div>

      <WhyAFace />
      <LovedByBots />
      <Install />

      <footer className="flex flex-wrap gap-4 border-t border-line pt-6 text-sm text-subtle">
        <span>aaavatars · MIT</span>
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
