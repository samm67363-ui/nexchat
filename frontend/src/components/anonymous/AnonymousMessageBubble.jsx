// frontend/src/components/anonymous/AnonymousMessageBubble.jsx
import React from "react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

export default function AnonymousMessageBubble({ message, isOwn, onReact }) {
  const [showPicker, setShowPicker] = React.useState(false);

  return (
    <div className={`anon-bubble-row ${isOwn ? "own" : "other"}`}>
      <div className="anon-bubble" onDoubleClick={() => setShowPicker((s) => !s)}>
        {message.fileUrl && message.fileType?.startsWith("image/") && (
          <img src={message.fileUrl} alt="attachment" className="anon-bubble-image" />
        )}
        {message.fileUrl && !message.fileType?.startsWith("image/") && (
          <a href={message.fileUrl} target="_blank" rel="noreferrer" className="anon-bubble-file">
            📎 File attachment
          </a>
        )}
        {message.content && <p>{message.content}</p>}
        <div className="anon-bubble-meta">
          <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          {isOwn && <span className="anon-bubble-status">{message.read ? "Read" : message.delivered ? "Delivered" : "Sent"}</span>}
        </div>
        {message.reactions?.length > 0 && (
          <div className="anon-bubble-reactions">
            {message.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
          </div>
        )}
        {showPicker && (
          <div className="anon-reaction-picker">
            {REACTIONS.map((e) => (
              <button key={e} onClick={() => { onReact(message._id, e); setShowPicker(false); }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}