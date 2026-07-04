import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../context/ThemeContext";
import ConversationItem from "../chat/ConversationItem";
import SearchUsers from "../chat/SearchUsers";
import Avatar from "../ui/Avatar";

export default function Sidebar() {
  const { dbUser, logout } = useAuth();
  const { conversations } = useChat();
  const { isDark, toggle } = useTheme();
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const other = c.participants?.find((p) => p._id !== dbUser?._id);
    return (
      other?.username?.toLowerCase().includes(search.toLowerCase()) ||
      c.groupName?.toLowerCase().includes(search.toLowerCase())
    );
  });

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

      {/* Conversations */}
      <div className="sidebar-list">
        {filtered.length === 0 ? (
          <div className="sidebar-empty">
            <p>No conversations yet</p>
            <button className="sidebar-new-btn" onClick={() => setShowSearch(true)}>
              Start a chat
            </button>
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem key={conv._id} conversation={conv} />
          ))
        )}
      </div>

      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
    </aside>
  );
}