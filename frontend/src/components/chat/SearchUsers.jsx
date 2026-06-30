import React, { useState, useCallback } from "react";
import api from "../../services/api";
import { useChat } from "../../context/ChatContext";
import Avatar from "../ui/Avatar";

export default function SearchUsers({ onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setActiveConversation, fetchMessages, fetchConversations } = useChat();

  const search = useCallback(async (q) => {
    if (!q.trim()) return setResults([]);
    setLoading(true);
    try {
      const res = await api.get(`/users/search?q=${q}`);
      setResults(res.data);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleInput = (e) => {
    setQuery(e.target.value);
    search(e.target.value);
  };

  const startChat = async (user) => {
    const res = await api.post("/conversations", { recipientId: user._id });
    await fetchConversations();
    setActiveConversation(res.data);
    fetchMessages(res.data._id);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>New Conversation</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="search-modal-input">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            autoFocus
            placeholder="Search by name or email..."
            value={query}
            onChange={handleInput}
          />
        </div>
        <div className="search-results">
          {loading && <div className="search-loading">Searching…</div>}
          {!loading && results.length === 0 && query && (
            <div className="search-empty">No users found</div>
          )}
          {results.map((user) => (
            <div key={user._id} className="search-result-item" onClick={() => startChat(user)}>
              <Avatar user={user} size={40} />
              <div>
                <p className="search-result-name">{user.username}</p>
                <p className="search-result-email">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}