import React, { useState, useRef, useCallback } from "react";
import { useChat } from "../../context/ChatContext";
import EmojiPicker from "emoji-picker-react";
import { useTheme } from "../../context/ThemeContext";

export default function ComposerBar({ conversationId }) {
  const { sendMessage, startTyping, stopTyping } = useChat();
  const { isDark } = useTheme();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const typingTimer = useRef(null);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    setText(e.target.value);
    startTyping(conversationId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => stopTyping(conversationId), 1500);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage(conversationId, trimmed);
    setText("");
    stopTyping(conversationId);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, [text, conversationId, sendMessage, stopTyping]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="composer">
      {showEmoji && (
        <div className="emoji-picker-wrap">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={isDark ? "dark" : "light"}
            width={320}
            height={380}
            searchDisabled={false}
            skinTonesDisabled
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      <div className="composer-inner">
        <button
          className={`composer-btn ${showEmoji ? "active" : ""}`}
          onClick={() => setShowEmoji((p) => !p)}
          title="Emoji"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
        </button>

        <button className="composer-btn" title="Attach file">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>

        <textarea
          ref={inputRef}
          className="composer-input"
          placeholder="Message…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        {text.trim() ? (
          <button className="composer-send active" onClick={handleSend} title="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg>
          </button>
        ) : (
          <button className="composer-btn" title="Voice message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}