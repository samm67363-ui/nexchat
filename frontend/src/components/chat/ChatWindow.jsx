import React, { useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import MessageBubble from "./MessageBubble";
import ComposerBar from "./ComposerBar";
import Avatar from "../ui/Avatar";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow() {
  const { dbUser } = useAuth();
  const { activeConversation, messages, typingUsers, onlineUsers, fetchMessages } = useChat();
  const bottomRef = useRef(null);

  const convId = activeConversation?._id;
  const convMessages = messages[convId] || [];
  const isGroup = activeConversation?.type === "group";
  const other = !isGroup
    ? activeConversation?.participants?.find((p) => p._id !== dbUser?._id)
    : null;

  const displayName = isGroup ? activeConversation.groupName : other?.username || "Unknown";
  const isOnline = other ? onlineUsers[other._id] === "online" || other.status === "online" : false;

  const typing = typingUsers[convId] ? Object.values(typingUsers[convId]) : [];

  useEffect(() => {
    if (convId) fetchMessages(convId);
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convMessages, typing]);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <Avatar user={isGroup ? null : other} groupName={isGroup ? activeConversation.groupName : null} size={40} />
          <div className="chat-header-info">
            <span className="chat-header-name">{displayName}</span>
            <span className={`chat-header-status ${isOnline ? "online" : "offline"}`}>
              {isGroup
                ? `${activeConversation.participants?.length} members`
                : isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" title="Search messages">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </button>
          <button className="icon-btn" title="Video call">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
          </button>
          <button className="icon-btn" title="Voice call">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {convMessages.length === 0 && (
          <div className="chat-messages-empty">
            <p>Say hello to {displayName}!</p>
          </div>
        )}
        {convMessages.map((msg, idx) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            isOwn={msg.sender?._id === dbUser?._id || msg.sender === dbUser?._id}
            showAvatar={
              !isGroup
                ? false
                : idx === 0 || convMessages[idx - 1]?.sender?._id !== msg.sender?._id
            }
          />
        ))}
        {typing.length > 0 && <TypingIndicator names={typing} />}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <ComposerBar conversationId={convId} />
    </div>
  );
}