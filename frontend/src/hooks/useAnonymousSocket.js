// frontend/src/hooks/useAnonymousSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;// same backend URL your other socket uses

export default function useAnonymousSocket({ roomId, identity }) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [presence, setPresence] = useState({}); // { nickname: 'online'|'offline' }
  const [typingUser, setTypingUser] = useState(null);
  const [ended, setEnded] = useState(false);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    if (!roomId || !identity) return;

    const socket = io(`${SOCKET_URL}/anonymous`, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("anonymous:join", {
        roomId,
        guestId: identity.type === "guest" ? identity.guestId : undefined,
        hostUid: identity.type === "host" ? identity.hostUid : undefined,
      });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("anonymous:presence", ({ nickname, status }) => {
      setPresence((prev) => ({ ...prev, [nickname]: status }));
    });

    socket.on("anonymous:message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("anonymous:typing", ({ nickname, isTyping }) => {
      setTypingUser(isTyping ? nickname : null);
    });

    socket.on("anonymous:read", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, read: true } : m))
      );
    });

    socket.on("anonymous:react", ({ messageId, emoji, by }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, reactions: [...(m.reactions || []), { emoji, by }] }
            : m
        )
      );
    });

    socket.on("anonymous:ended", () => setEnded(true));
    socket.on("anonymous:error", ({ message }) => setSocketError(message));

    return () => {
      socket.disconnect();
    };
  }, [roomId, identity]);

  const sendMessage = useCallback((content, fileUrl = null, fileType = null) => {
    socketRef.current?.emit("anonymous:message", { roomId, content, fileUrl, fileType });
  }, [roomId]);

  const sendTyping = useCallback((isTyping) => {
    socketRef.current?.emit("anonymous:typing", { isTyping });
  }, []);

  const markRead = useCallback((messageId) => {
    socketRef.current?.emit("anonymous:read", { messageId });
  }, []);

  const react = useCallback((messageId, emoji) => {
    socketRef.current?.emit("anonymous:react", { messageId, emoji });
  }, []);

  const endChat = useCallback(() => {
    socketRef.current?.emit("anonymous:end", { roomId });
  }, [roomId]);

  return {
    connected, messages, presence, typingUser, ended, socketError,
    sendMessage, sendTyping, markRead, react, endChat,
  };
}