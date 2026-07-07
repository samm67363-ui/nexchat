import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";
import ConversationItem from "../chat/ConversationItem";
import SearchUsers from "../chat/SearchUsers";
import Avatar from "../ui/Avatar";
import GenerateInviteModal from "../chat/GenerateInviteModal";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../../services/socket";

const FILTERS = ["All", "Unread", "Favourites"];

export default function Sidebar() {
  const { dbUser, logout } = useAuth();
  const { conversations } = useChat();
  const socket = getSocket();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  // Live anonymous sessions where the current user is the host.
  // Keyed by roomId so repeated join events don't duplicate entries.
  const [anonSessions, setAnonSessions] = useState({});

  useEffect(() => {
    if (!socket) return;

    // Backend should emit this on the host's main socket connection
    // whenever a guest joins one of the host's anonymous invite rooms.
    // Payload shape assumed: { roomId, nickname, lastMessage, unread }
    const handleGuestJoined = ({ roomId, nickname }) => {
      setAnonSessions((prev) => ({
        ...prev,
        [roomId]: {
          roomId,
          nickname,
          lastMessage: prev[roomId]?.lastMessage || "Guest joined",
          unread: true,
          favourite: prev[roomId]?.favourite || false,
        },
      }));
    };

    const handleAnonMessage = ({ roomId, content, fromGuest }) => {
      setAnonSessions((prev) =>
        prev[roomId]
          ? {
              ...prev,
              [roomId]: {
                ...prev[roomId],
                lastMessage: content,
                unread: fromGuest ? true : prev[roomId].unread,
              },
            }
          : prev
      );
    };

    const handleAnonEnded = ({ roomId }) => {
      setAnonSessions((prev) => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    };

    socket.on("anonymous:guest-joined", handleGuestJoined);
    socket.on("anonymous:host-message-update", handleAnonMessage);
    socket.on("anonymous:ended", handleAnonEnded);

    return () => {
      socket.off("anonymous:guest-joined", handleGuestJoined);
      socket.off("anonymous:host-message-update", handleAnonMessage);
      socket.off("anonymous:ended", handleAnonEnded);
    };
  }, [socket]);

  const anonList = Object.values(anonSessions);

  const openAnonSession = (roomId) => {
    setAnonSessions((prev) =>
      prev[roomId] ? { ...prev, [roomId]: { ...prev[roomId], unread: false } } : prev
    );
    navigate(`/anonymous/${roomId}`);
  };

  const toggleFavourite = (roomId, e) => {
    e.stopPropagation();
    setAnonSessions((prev) => ({
      ...prev,
      [roomId]: { ...prev[roomId], favourite: !prev[roomId].favourite },
    }));
  };

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const other = c.participants?.find((p) => p._id !== dbUser?._id);
    return (
      other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.groupName?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredAnon = anonList.filter((a) => {
    if (search && !a.nickname?.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeFilter === "Unread") return a.unread;
    if (activeFilter === "Favourites") return a.favourite;
    return true;
  });

  const showRegularList =
    activeFilter === "All" ||
    (activeFilter === "Unread" && filteredConversations.some((c) => c.unreadCount > 0)) ||
    activeFilter === "Favourites";

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">⚡</span>
          <span className="sidebar-brand-name">NexChat</span>
        </div>
        <div className="sidebar-header-actions">
          <button className="icon-btn" onClick={toggle} title="Toggle theme">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button className="icon-btn" onClick={() => setShowInvite(true)} title="Anonymous Chat Link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setShowSearch(true)} title="New chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button className="icon-btn danger" onClick={logout} title="Logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
          <button className="icon-btn" onClick={() => window.location.href='/privacy'} title="Privacy Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Profile strip */}
      <div className="sidebar-profile">
        <Avatar user={dbUser} size={38} />
        <div className="sidebar-profile-info">
          <span className="sidebar-profile-name">{dbUser?.username}</span>
          <span className="sidebar-profile-status online">Online</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="sidebar-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter tabs */}
      <div className="sidebar-filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`sidebar-filter-tab ${activeFilter === f ? "active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Conversations */}
      <div className="sidebar-list">
        {filteredAnon.map((a) => (
          <div
            key={a.roomId}
            className={`conv-item anon-conv-item ${a.unread ? "unread" : ""}`}
            onClick={() => openAnonSession(a.roomId)}
          >
            <div className="conv-avatar-wrap">
              <div className="anon-avatar-badge">🎭</div>
            </div>
            <div className="conv-info">
              <div className="conv-top">
                <span className="conv-name">Anonymous · {a.nickname}</span>
                <button
                  className={`icon-btn favourite-star ${a.favourite ? "active" : ""}`}
                  onClick={(e) => toggleFavourite(a.roomId, e)}
                  title="Toggle favourite"
                >
                  ★
                </button>
              </div>
              <div className="conv-bottom">
                <span className="conv-preview">{a.lastMessage}</span>
                {a.unread && <span className="conv-unread-dot" />}
              </div>
            </div>
          </div>
        ))}

        {showRegularList && filteredConversations.length === 0 && filteredAnon.length === 0 ? (
          <div className="sidebar-empty">
            <p>No conversations yet</p>
            <button className="sidebar-new-btn" onClick={() => setShowSearch(true)}>
              Start a chat
            </button>
          </div>
        ) : (
          showRegularList &&
          filteredConversations.map((conv) => (
            <ConversationItem key={conv._id} conversation={conv} />
          ))
        )}
      </div>

      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
      {showInvite && <GenerateInviteModal onClose={() => setShowInvite(false)} />}
    </aside>
  );
}