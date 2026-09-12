// UserAvatar.jsx
import { avatarColor } from "../utils/avatarColor";

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function UserAvatar({ user, name, avatarUrl, size = 32, className = "", style = {}, title }) {
  const displayName = user?.name || name || "?";
  const src = user?.avatarUrl || avatarUrl;
  const userInitials = initials(displayName);
  const bgColor = avatarColor(displayName);

  if (src) {
    return (
      <img
        src={src}
        alt={displayName}
        title={title || displayName}
        className={`cb-user-avatar-img ${className}`}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          display: "inline-block",
          ...style,
        }}
      />
    );
  }

  return (
    <div
      title={title || displayName}
      className={`cb-user-avatar-fallback ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bgColor,
        color: "#ffffff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(10, Math.floor(size * 0.38)),
        fontWeight: 800,
        flexShrink: 0,
        ...style,
      }}
    >
      {userInitials}
    </div>
  );
}
