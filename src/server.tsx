import { renderToStaticMarkup } from "react-dom/server";

import { Avatar, type AvatarProps } from "./Avatar.js";

export type StaticAvatarProps = Omit<AvatarProps, "interactive" | "renderMouth">;

export function renderAvatarSvg(props: StaticAvatarProps): string {
  return renderToStaticMarkup(<Avatar {...props} />);
}
