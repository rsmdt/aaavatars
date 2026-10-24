import { Avatar, type AvatarProps, frameRadius } from "./Avatar.js";

export interface AvatarGroupProps {
  className?: string;
  max?: number;
  members: readonly Omit<AvatarProps, "size">[];
  overlap?: number;
  ringColor?: string;
  size?: number;
}

export function AvatarGroup({
  className,
  max = 4,
  members,
  overlap = 0.3,
  ringColor = "#FFFFFF",
  size = 32,
}: AvatarGroupProps) {
  const limit = Math.max(1, Math.floor(max));
  const visible = members.length > limit ? members.slice(0, Math.max(limit - 1, 1)) : members;
  const hidden = members.length - visible.length;
  const label = [
    visible.map((member) => member.name).join(", "),
    hidden ? `and ${hidden} more` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const offset = -Math.round(size * overlap);
  const seen = new Map<string, number>();
  const keys = visible.map((member) => {
    const count = seen.get(member.name) ?? 0;
    seen.set(member.name, count + 1);
    return `${member.name}-${count}`;
  });

  return (
    <div aria-label={label} className={className} role="group" style={{ display: "inline-flex" }}>
      {visible.map((member, index) => (
        <span
          key={keys[index]}
          style={{
            borderRadius: frameRadius(member.frame),
            boxShadow: member.frame === undefined ? undefined : `0 0 0 2px ${ringColor}`,
            display: "inline-flex",
            marginLeft: index === 0 ? 0 : offset,
            zIndex: visible.length - index,
          }}
        >
          <Avatar {...member} size={size} />
        </span>
      ))}
      {hidden ? (
        <span
          data-overflow=""
          style={{
            alignItems: "center",
            background: "#F1F2F3",
            borderRadius: "50%",
            boxShadow: `0 0 0 2px ${ringColor}`,
            color: "#333333",
            display: "inline-flex",
            fontFamily: "system-ui, sans-serif",
            fontSize: Math.round(size * 0.36),
            fontWeight: 600,
            height: size,
            justifyContent: "center",
            marginLeft: offset,
            width: size,
          }}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
