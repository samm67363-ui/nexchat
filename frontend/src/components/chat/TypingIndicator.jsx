import React from "react";

export default function TypingIndicator({ names }) {
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names.slice(0, 2).join(", ")} are typing`;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span /><span /><span />
      </div>
      <span className="typing-label">{label}</span>
    </div>
  );
}