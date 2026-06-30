import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import Avatar from "../ui/Avatar";
import { formatDistanceToNow } from "date-fns";

export default function ConversationItem({ conversation }) {
  const { dbUser } = useAuth();
  const { activeConversation, setActiveConversation, fetchMessages, markAsRead, onlineUsers } = useChat();

  const isActive = activeConversation?._id === conversation._id;
  const isGroup = conversation.type === "group";
  const other = !isGroup
    ? conversation.participants?.find((p) => p._id !== dbUser?._id)
    : null;

  const displayName = isGroup ? conversation.groupName : other?.username || "Unknown";
  const lastMsg = conversation.lastMessage;
  const preview = lastMsg?.content
    ? lastMsg.content.length > 40
      ? lastMsg.content.slice(0, 40) + "…"
      : lastMsg.content
    : "No messages yet";

  const timeAgo = lastMsg?.createdAt
    ? formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })
        .replace("about ", "")
        .replace(" minutes", "m")
        .replace(" minute", "m")
        .replace(" hours", "h")
        .replace(" hour", "h")
        .replace(" days", "d")
        .replace(" day", "d")
    : "";

  const isOnline = other ? onlineUsers[other._id] === "online" || other.status === "online" : false;

  const handleClick = () => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
    markAsRead(conversation._id);
  };

  return (
    <div className={`conv-item ${isActive ? "active" : ""}`} onClick={handleClick}>
      <div className="conv-avatar-wrap">
        <Avatar user={isGroup ? null : other} groupName={isGroup ? conversation.groupName : null} size={46} />
        {!isGroup && isOnline && <span className="conv-online-dot" />}
      </div>
      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{displayName}</span>
          {timeAgo && <span className="conv-time">{timeAgo}</span>}
        </div>
        <div className="conv-bottom">
          <span className="conv-preview">{preview}</span>
        </div>
      </div>
    </div>
  );
}