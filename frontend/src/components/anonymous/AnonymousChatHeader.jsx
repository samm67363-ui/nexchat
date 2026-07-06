// frontend/src/components/anonymous/AnonymousChatHeader.jsx
import React, { useState, useEffect } from "react";

export default function AnonymousChatHeader({ otherNickname, otherStatus, expiresAt, onEndChat, onReport }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = new Date(expiresAt) - new Date();
      if (diff <= 0) return setTimeLeft("Expired");
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="anon-chat-header">
      <div className="anon-chat-header-left">
        <span className="anon-badge">🕵️ Anonymous</span>
        <div>
          <h3>{otherNickname || "Waiting for other user..."}</h3>
          <span className={`anon-status ${otherStatus}`}>{otherStatus || "connecting"}</span>
        </div>
      </div>
      <div className="anon-chat-header-right">
        {expiresAt && <span className="anon-countdown">⏱ {timeLeft}</span>}
        <button className="anon-report-btn" onClick={onReport} title="Report">🚩</button>
        <button className="anon-end-btn" onClick={onEndChat}>End Chat</button>
      </div>
    </div>
  );
}