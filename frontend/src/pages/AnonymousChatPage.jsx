// frontend/src/pages/AnonymousChatPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
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

  // FIX: read guestData once via useMemo (keyed on roomId) instead of on
  // every render, and build `identity` via useMemo keyed on the underlying
  // primitive values — not a fresh object literal each render. Previously
  // this created a new `identity` reference on every render, which made
  // useAnonymousSocket's useEffect tear down and reconnect the socket
  // constantly (visible as dozens of short-lived websocket connections
  // in the Network tab).
  const guestData = useMemo(
    () => JSON.parse(sessionStorage.getItem(`guest_${roomId}`) || "null"),
    [roomId]
  );

  const identity = useMemo(() => {
    if (guestData) {
      return { type: "guest", guestId: guestData.guestId, nickname: guestData.nickname };
    }
    if (currentUser) {
      return { type: "host", hostUid: currentUser.uid, nickname: currentUser.username };
    }
    return null;
  }, [guestData, currentUser?.uid, currentUser?.username]);

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
        {messages.map((m) => {
          // Compare by role (host/guest), not nickname string — nickname
          // comparison breaks if the guest happens to pick the same nickname
          // as the host's username, or if currentUser.username and the
          // backend's stored host.username differ in casing/whitespace.
          const isOwn =
            identity.type === "host"
              ? m.senderType === "user"
              : m.senderType === "guest";
          return (
            <AnonymousMessageBubble
              key={m._id}
              message={m}
              isOwn={isOwn}
              onReact={react}
            />
          );
        })}
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