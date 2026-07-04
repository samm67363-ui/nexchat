import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import api from "../services/api";
import Avatar from "../components/ui/Avatar";
import "../styles/privacy.css";

export default function PrivacySettingsPage() {
  const { dbUser } = useAuth();
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current privacy settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/privacy");
        setHiddenUsers(res.data.hiddenFrom || []);
      } catch (err) {
        console.error("Failed to load privacy settings:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Search users
  useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) return setSearchResults([]);
      try {
        const res = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(res.data);
      } catch {
        setSearchResults([]);
      }
    };
    const timer = setTimeout(search, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isHidden = (userId) =>
    hiddenUsers.some((u) => u._id === userId);

  const handleHide = async (user) => {
    setSaving(true);
    try {
      const res = await api.post("/privacy/hide", { targetUserId: user._id });
      setHiddenUsers(res.data.hiddenFrom || []);
      // Notify socket to re-broadcast status
      const socket = getSocket();
      if (socket) socket.emit("privacy:updated");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleUnhide = async (userId) => {
    setSaving(true);
    try {
      const res = await api.post("/privacy/unhide", { targetUserId: userId });
      setHiddenUsers(res.data.hiddenFrom || []);
      const socket = getSocket();
      if (socket) socket.emit("privacy:updated");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="privacy-loading">Loading settings...</div>;

  return (
    <div className="privacy-page">
      <div className="privacy-card">
        {/* Header */}
        <div className="privacy-header">
          <button className="privacy-back" onClick={() => window.history.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div>
            <h1>Privacy Settings</h1>
            <p>Control who can see your online status</p>
          </div>
        </div>

        {/* Search to add users */}
        <div className="privacy-section">
          <h2>Hide online status from</h2>
          <div className="privacy-search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search users to hide from..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="privacy-results">
              {searchResults.map((user) => (
                <div key={user._id} className="privacy-user-item">
                  <Avatar user={user} size={40} />
                  <div className="privacy-user-info">
                    <span className="privacy-user-name">{user.username}</span>
                    <span className="privacy-user-email">{user.email}</span>
                  </div>
                  <button
                    className={`privacy-toggle-btn ${isHidden(user._id) ? "unhide" : "hide"}`}
                    onClick={() => isHidden(user._id) ? handleUnhide(user._id) : handleHide(user)}
                    disabled={saving}
                  >
                    {isHidden(user._id) ? "Unhide" : "Hide"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Currently hidden users */}
        <div className="privacy-section">
          <h2>Currently hidden from ({hiddenUsers.length})</h2>
          {hiddenUsers.length === 0 ? (
            <div className="privacy-empty">
              <p>Your online status is visible to everyone</p>
            </div>
          ) : (
            <div className="privacy-hidden-list">
              {hiddenUsers.map((user) => (
                <div key={user._id} className="privacy-user-item">
                  <Avatar user={user} size={40} />
                  <div className="privacy-user-info">
                    <span className="privacy-user-name">{user.username}</span>
                    <span className="privacy-user-email">{user.email}</span>
                  </div>
                  <button
                    className="privacy-toggle-btn unhide"
                    onClick={() => handleUnhide(user._id)}
                    disabled={saving}
                  >
                    Unhide
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}