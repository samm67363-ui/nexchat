import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useChat } from "../context/ChatContext";
import Avatar from "../components/ui/Avatar";
import "../styles/invite.css";

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { setActiveConversation, fetchMessages, fetchConversations } = useChat();

  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Validate invite on load
  useEffect(() => {
    const validate = async () => {
      try {
        const res = await api.get(`/invites/${code}`);
        setInvite(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Invalid invite link");
      } finally {
        setLoading(false);
      }
    };
    validate();
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await api.post(`/invites/${code}/join`);
      const { conversation } = res.data;

      // Refresh conversations list and open the chat
      await fetchConversations();
      setActiveConversation(conversation);
      fetchMessages(conversation._id);

      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
      setJoining(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-loading">
            <div className="invite-spinner" />
            <p>Validating invite link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-error-icon">✕</div>
          <h2>Link Unavailable</h2>
          <p className="invite-error-msg">{error}</p>
          <button className="invite-btn secondary" onClick={() => navigate("/")}>
            Go to NexChat
          </button>
        </div>
      </div>
    );
  }

  // Valid invite
  return (
    <div className="invite-page">
      <div className="invite-card animate-slide-up">
        {/* Header */}
        <div className="invite-logo">
          <div className="invite-logo-icon">⚡</div>
          <h1>NexChat</h1>
        </div>

        <div className="invite-divider" />

        {/* Invite info */}
        <div className="invite-info">
          <Avatar user={invite.createdBy} size={64} />
          <h2>{invite.createdBy.username}</h2>
          <p>invited you to a private anonymous chat</p>
        </div>

        {/* Expiry timer */}
        <div className="invite-expiry">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <span>
            Expires at {new Date(invite.expiresAt).toLocaleTimeString()}
          </span>
        </div>

        {/* Features */}
        <div className="invite-features">
          <div className="invite-feature">
            <span>🔒</span>
            <p>One-time use only</p>
          </div>
          <div className="invite-feature">
            <span>⏱️</span>
            <p>Expires in 10 minutes</p>
          </div>
          <div className="invite-feature">
            <span>💬</span>
            <p>Private conversation</p>
          </div>
        </div>

        {/* Actions */}
        <button
          className="invite-btn primary"
          onClick={handleJoin}
          disabled={joining}
        >
          {joining ? (
            <><span className="invite-spinner small" /> Joining...</>
          ) : (
            "Accept & Start Chatting"
          )}
        </button>

        <button
          className="invite-btn secondary"
          onClick={() => navigate("/")}
        >
          Decline
        </button>
      </div>
    </div>
  );
}