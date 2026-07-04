import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/auth.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed");
    } finally { setLoading(false); }
    import { useNavigate, useLocation, Link } from "react-router-dom";

// Inside LoginPage component:
const location = useLocation();
const params = new URLSearchParams(location.search);
const redirect = params.get("redirect") || "/";

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    await login(form.email, form.password);
    navigate(redirect); // ← redirect back to invite page
  } catch (err) {
    toast.error(err.message || "Login failed");
  } finally {
    setLoading(false);
  }
};
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <h1>NexChat</h1>
          <p>The next generation of messaging</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="••••••••"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>
        <p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  );
}