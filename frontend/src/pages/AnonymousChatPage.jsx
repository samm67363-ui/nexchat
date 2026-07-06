// frontend/src/pages/AnonymousChatPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useAnonymousSocket from "../hooks/useAnonymousSocket";
import AnonymousChatHeader from "../components/anonymous/AnonymousChatHeader";
import AnonymousMessageBubble from "../components/anonymous/AnonymousMessageBubble";
import "../styles/invite.css";
import { reportRoom } from "../services/anonymousApi";

export default function AnonymousChatPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const guestData = JSON.parse(sessionStorage.getItem(`guest_${roomId}`) || "null");
  const identity = guestData
    ? { type: "guest", guestId: guestData.guestId, nickname: guestData.nickname }
    : currentUser
    ? { type: "host", hostUid: currentUser.uid, nickname: currentUser.username }
    : null;

  const {
    connected, messages, presence, typingUser, ended, socketError,
    sendMessage, sendTyping, markRead, react, endChat,
  } = useAnonymousSocket({ roomId, identity });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (ended) {
      sessionStorage.removeItem(`guest_${roomId}`);
      navigate("/anonymous/ended");
    }
  }, [ended, roomId, navigate]);

  if (!identity) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <h2>Session not found</h2>
          <p>You need a valid invite link to join this chat.</p>
          <button className="invite-btn secondary" onClick={() => navigate("/")}>Go to NexChat</button>
        </div>
      </div>
    );
  }

  const otherNickname = Object.keys(presence).find((n) => n !== identity.nickname);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
    sendTyping(false);
  };

  return (
    <div className="anon-chat-page">
      <AnonymousChatHeader
        otherNickname={otherNickname}
        otherStatus={otherNickname ? presence[otherNickname] : "waiting"}
        expiresAt={null /* room-level 24h backstop, not shown as urgent countdown */}
        onEndChat={endChat}
        onReport={async () => {
  try {
    await reportRoom(roomId, identity.nickname, "user-reported");
    alert("Report submitted. Our team will review this conversation.");
  } catch {
    alert("Failed to submit report. Please try again.");
  }
}}

      />

      {!connected && <div className="anon-connecting-banner">Reconnecting...</div>}
      {socketError && <div className="anon-error-banner">{socketError}</div>}

      <div className="anon-message-list">
        {messages.map((m) => (
          <AnonymousMessageBubble
            key={m._id}
            message={m}
            isOwn={m.senderNickname === identity.nickname}
            onReact={react}
          />
        ))}
        {typingUser && typingUser !== identity.nickname && (
          <div className="anon-typing-indicator">{typingUser} is typing...</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="anon-composer">
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            sendTyping(e.target.value.length > 0);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}