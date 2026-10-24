import { renderToStaticMarkup } from "react-dom/server";

import { Avatar, type AvatarProps, InlineStyleContext } from "./Avatar.js";
import { hash } from "./spec.js";

export type StaticAvatarProps = Omit<AvatarProps, "interactive" | "renderMouth">;

export function renderAvatarSvg(props: StaticAvatarProps): string {
  return renderToStaticMarkup(
    <InlineStyleContext.Provider value>
      <Avatar {...props} />
    </InlineStyleContext.Provider>,
    { identifierPrefix: `s${hash(JSON.stringify(props)).toString(36)}-` },
  );
}
