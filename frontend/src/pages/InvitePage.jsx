// frontend/src/pages/InvitePage.jsx  (REPLACES the old auth-gated version)
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { validateInvite, joinInvite } from "../services/anonymousApi";
import NicknameModal from "../components/anonymous/NicknameModal";
import Avatar from "../components/ui/Avatar";
import { useAuth } from "../context/AuthContext";
import "../styles/invite.css";

export default function InvitePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // only used to detect "creator opened own link"

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await validateInvite(code);
        setInvite(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "This invite link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  const isOwnLink =
    currentUser && invite && currentUser.username === invite.hostUsername;

  const handleJoin = async (nickname) => {
    setJoining(true);
    setJoinError("");
    try {
      const res = await joinInvite(code, nickname);
      const { guestId, roomId } = res.data;

      // Persist guest identity for reconnection (Step 6 chat page reads this)
      sessionStorage.setItem(`guest_${roomId}`, JSON.stringify({ guestId, nickname }));

      navigate(`/anonymous/${roomId}`);
    } catch (err) {
      setJoinError(err.response?.data?.message || "Failed to join chat.");
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-spinner" />
          <p>Validating invite link...</p>
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

  if (isOwnLink) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <h2>This is your own invite link</h2>
          <p>Share it with someone else — you can't join your own anonymous chat.</p>
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
          <Avatar user={{ avatarUrl: invite.hostAvatar }} size={64} />
          <h2>{invite.hostUsername}</h2>
          <p>invited you to an anonymous chat</p>
        </div>
        <div className="invite-expiry">
          <span>Expires at {new Date(invite.expiresAt).toLocaleTimeString()}</span>
        </div>
        <div className="invite-features">
          <div className="invite-feature"><span>🕵️</span><p>No account needed</p></div>
          <div className="invite-feature"><span>⏱️</span><p>One-time, 10 min link</p></div>
          <div className="invite-feature"><span>💬</span><p>Private & anonymous</p></div>
        </div>
        <button className="invite-btn primary" onClick={() => setShowNicknameModal(true)}>
          Join Anonymous Chat
        </button>
      </div>

      {showNicknameModal && (
        <NicknameModal onJoin={handleJoin} joining={joining} error={joinError} />
      )}
    </div>
  );
}