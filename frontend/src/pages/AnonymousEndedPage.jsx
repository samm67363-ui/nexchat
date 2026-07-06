// frontend/src/pages/AnonymousEndedPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/invite.css";

export default function AnonymousEndedPage() {
  const navigate = useNavigate();
  return (
    <div className="invite-page">
      <div className="invite-card">
        <div className="invite-logo-icon">💬</div>
        <h2>Chat Ended</h2>
        <p>This anonymous conversation has ended and all messages have been deleted.</p>
        <button className="invite-btn primary" onClick={() => navigate("/")}>
          Go to NexChat
        </button>
      </div>
    </div>
  );
}