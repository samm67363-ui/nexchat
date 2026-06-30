import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";
import { getSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { dbUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  const fetchConversations = useCallback(async () => {
    if (!dbUser) return;
    const res = await api.get("/conversations");
    setConversations(res.data);
    // Join all rooms
    const socket = getSocket();
    if (socket) socket.emit("conversations:join", res.data.map((c) => c._id));
  }, [dbUser]);

  const fetchMessages = useCallback(async (conversationId) => {
    if (messages[conversationId]) return;
    const res = await api.get(`/messages/${conversationId}`);
    setMessages((prev) => ({ ...prev, [conversationId]: res.data }));
  }, [messages]);

  const sendMessage = (conversationId, content, replyTo = null) => {
    const socket = getSocket();
    if (socket) {
      socket.emit("message:send", { conversationId, content, type: "text", replyTo });
    }
  };

  const startTyping = (conversationId) => {
    const socket = getSocket();
    if (socket) socket.emit("typing:start", { conversationId });
  };

  const stopTyping = (conversationId) => {
    const socket = getSocket();
    if (socket) socket.emit("typing:stop", { conversationId });
  };

  const markAsRead = (conversationId) => {
    const socket = getSocket();
    if (socket) socket.emit("messages:read", { conversationId });
  };

  const reactToMessage = (messageId, emoji) => {
    const socket = getSocket();
    if (socket) socket.emit("message:react", { messageId, emoji });
  };

  // Socket listeners
  useEffect(() => {
    if (!dbUser) return;
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (msg) => {
      setMessages((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg, lastActivity: msg.createdAt }
            : c
        ).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      );
    };

    const onTypingStart = ({ userId, username, conversationId }) => {
      if (userId === dbUser._id) return;
      setTypingUsers((prev) => ({
        ...prev,
        [conversationId]: { ...prev[conversationId], [userId]: username },
      }));
    };

    const onTypingStop = ({ userId, conversationId }) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        if (updated[conversationId]) {
          delete updated[conversationId][userId];
        }
        return updated;
      });
    };

    const onUserStatus = ({ userId, status }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: status }));
    };

    const onReacted = (updatedMsg) => {
      setMessages((prev) => ({
        ...prev,
        [updatedMsg.conversationId]: (prev[updatedMsg.conversationId] || []).map((m) =>
          m._id === updatedMsg._id ? updatedMsg : m
        ),
      }));
    };

    socket.on("message:new", onNewMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("user:status", onUserStatus);
    socket.on("message:reacted", onReacted);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("user:status", onUserStatus);
      socket.off("message:reacted", onReacted);
    };
  }, [dbUser]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return (
    <ChatContext.Provider value={{
      conversations, activeConversation, setActiveConversation,
      messages, fetchMessages, sendMessage,
      typingUsers, onlineUsers,
      startTyping, stopTyping, markAsRead, reactToMessage,
      fetchConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);