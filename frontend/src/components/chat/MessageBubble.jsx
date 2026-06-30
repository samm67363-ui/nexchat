import React, { useState } from "react";
import { useChat } from "../../context/ChatContext";
import Avatar from "../ui/Avatar";
import { format } from "date-fns";

const STATUS_ICONS = {
  sent: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
  ),
  delivered: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 7 17l-5-5"/><path d="M23 6l-9 9"/></svg>
  ),
  read: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5"><path d="M18 6 7 17l-5-5"/><path d="M23 6l-9 9"/></svg>
  ),
  failed: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
  ),
};

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

export default function MessageBubble({ message, isOwn, showAvatar }) {
  const { reactToMessage } = useChat();
  const [showReactions, setShowReactions] = useState(false);

  const time = message.createdAt
    ? format(new Date(message.createdAt), "HH:mm")
    : "";

  return (
    <div
      className={`bubble-row ${isOwn ? "own" : "other"}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {/* Avatar for incoming in group chats */}
      {!isOwn && showAvatar && (
        <Avatar user={message.sender} size={28} className="bubble-avatar" />
      )}
      {!isOwn && !showAvatar && <div style={{ width: 28 }} />}

      <div className="bubble-wrap">
        {/* Reply preview */}
        {message.replyTo && (
          <div className="bubble-reply-preview">
            <span className="bubble-reply-sender">{message.replyTo.sender?.username}</span>
            <span className="bubble-reply-text">{message.replyTo.content?.slice(0, 60)}</span>
          </div>
        )}

        {/* Sender name in group */}
        {!isOwn && showAvatar && (
          <span className="bubble-sender-name">{message.sender?.username}</span>
        )}

        <div className={`bubble ${isOwn ? "bubble-out" : "bubble-in"}`}>
          <span className="bubble-text">{message.content}</span>
          <div className="bubble-meta">
            <span className="bubble-time">{time}</span>
            {isOwn && <span className="bubble-status">{STATUS_ICONS[message.status] || STATUS_ICONS.sent}</span>}
          </div>
        </div>

        {/* Reactions display */}
        {message.reactions?.length > 0 && (
          <div className="bubble-reactions">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                className="reaction-pill"
                onClick={() => reactToMessage(message._id, r.emoji)}
              >
                {r.emoji} <span>{r.users?.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick emoji picker on hover */}
        {showReactions && (
          <div className={`emoji-quick-bar ${isOwn ? "left" : "right"}`}>
            {QUICK_EMOJIS.map((e) => (
              <button
                key={e}
                className="emoji-quick-btn"
                onClick={() => reactToMessage(message._id, e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}