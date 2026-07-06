// frontend/src/components/anonymous/NicknameModal.jsx
import React, { useState } from "react";
import "../../styles/invite.css";

const SUGGESTIONS = ["Shadow", "Ghost", "Unknown123", "Nomad", "Cipher"];

export default function NicknameModal({ onJoin, joining, error }) {
  const [nickname, setNickname] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (nickname.trim().length < 2) return;
    onJoin(nickname.trim());
  };

  return (
    <div className="nickname-modal-overlay">
      <div className="nickname-modal animate-slide-up">
        <h2>Choose a temporary nickname</h2>
        <p className="nickname-sub">No account needed — this name only exists for this chat.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Shadow"
            maxLength={20}
            autoFocus
          />
          <div className="nickname-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                type="button"
                key={s}
                className="nickname-chip"
                onClick={() => setNickname(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {error && <p className="nickname-error">{error}</p>}

          <button
            type="submit"
            className="invite-btn primary"
            disabled={joining || nickname.trim().length < 2}
          >
            {joining ? "Joining..." : "Join Anonymous Chat"}
          </button>
        </form>
      </div>
    </div>
  );
}