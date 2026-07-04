import React, { useState } from "react";
import api from "../../services/api";

export default function GenerateInviteModal({ onClose }) {
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/invites/generate");
      setInviteLink(res.data.inviteLink);
      setExpiresAt(res.data.expiresAt);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <h3>Anonymous Chat Link</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div style={{ padding: "20px" }}>
          {!inviteLink ? (
            <>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "20px", lineHeight: "1.6" }}>
                Generate a one-time anonymous chat link. Anyone with the link can start a private conversation with you. The link expires in <strong>10 minutes</strong> and can only be used <strong>once</strong>.
              </p>
              <button className="auth-btn" onClick={generate} disabled={loading} style={{ width: "100%" }}>
                {loading ? <span className="spinner" /> : "Generate Link"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "12px" }}>
                Share this link — expires at {new Date(expiresAt).toLocaleTimeString()}, one-time use only.
              </p>
              <div style={{
                background: "var(--bg-secondary)",
                border: "1.5px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "12px",
                wordBreak: "break-all",
                fontSize: "13px",
                color: "var(--accent)",
                marginBottom: "12px",
                lineHeight: "1.5",
              }}>
                {inviteLink}
              </div>
              <button className="auth-btn" onClick={copyLink} style={{ width: "100%", marginBottom: "10px" }}>
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
              <button
                onClick={generate}
                disabled={loading}
                style={{
                  width: "100%", padding: "10px",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-secondary)",
                  fontSize: "14px", cursor: "pointer",
                }}
              >
                Generate New Link
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}