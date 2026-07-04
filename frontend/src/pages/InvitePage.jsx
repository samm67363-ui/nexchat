import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import Avatar from "../components/ui/Avatar";
import "../styles/invite.css";

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { setActiveConversation, fetchMessages, fetchConversations } = useChat();

  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

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
      await fetchConversations();
      setActiveConversation(conversation);
      fetchMessages(conversation._id);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join");
      setJoining(false);
    }
  };

  // Not logged in — show login prompt
  if (!currentUser) {
    return (
      <div className="invite-page">
        <div className="invite-card animate-slide-up">
          <div className="invite-logo">
            <div className="invite-logo-icon">⚡</div>
            <h1>NexChat</h1>
          </div>
          <div className="invite-divider" />
          <div className="invite-info">
            <p>You need to be logged in to accept this invite.</p>
          </div>
          <Link
            to={`/login?redirect=/invite/${code}`}
            className="invite-btn primary"
            style={{ textDecoration: "none", marginBottom: "10px" }}
          >
            Sign In to Accept
          </Link>
          <Link
            to={`/register?redirect=/invite/${code}`}
            className="invite-btn secondary"
            style={{ textDecoration: "none" }}
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="invite-page">
      <div className="invite-card animate-slide-up">
        <div className="invite-logo">
          <div className="invite-logo-icon">⚡</div>
          <h1>NexChat</h1>
        </div>
        <div className="invite-divider" />
        <div className="invite-info">
          <Avatar user={invite.createdBy} size={64} />
          <h2>{invite.createdBy.username}</h2>
          <p>invited you to a private anonymous chat</p>
        </div>
        <div className="invite-expiry">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span>Expires at {new Date(invite.expiresAt).toLocaleTimeString()}</span>
        </div>
        <div className="invite-features">
          <div className="invite-feature"><span>🔒</span><p>One-time use only</p></div>
          <div className="invite-feature"><span>⏱️</span><p>Expires in 10 min</p></div>
          <div className="invite-feature"><span>💬</span><p>Private chat</p></div>
        </div>
        <button className="invite-btn primary" onClick={handleJoin} disabled={joining}>
          {joining ? <><span className="invite-spinner small" /> Joining...</> : "Accept & Start Chatting"}
        </button>
        <button className="invite-btn secondary" onClick={() => navigate("/")}>
          Decline
        </button>
      </div>
    </div>
  );
}