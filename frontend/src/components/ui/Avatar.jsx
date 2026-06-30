import React from "react";

export default function Avatar({ user, groupName, size = 40, className = "" }) {
  const initials = groupName
    ? groupName.slice(0, 2).toUpperCase()
    : user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "??";

  const seed = user?.username || groupName || "default";
  const avatarUrl = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  const colors = ["#5b6af0", "#7c4dff", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  const colorIdx =
    seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  const bgColor = colors[colorIdx];

  return (
    <div
      className={`avatar ${className}`}
      style={{ width: size, height: size, minWidth: size, borderRadius: "50%", overflow: "hidden", background: bgColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff" }}
    >
      {user?.avatar && !user.avatar.includes("dicebear") ? (
        <img src={user.avatar} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}