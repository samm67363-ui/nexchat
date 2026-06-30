import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "../styles/auth.css";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be 6+ characters");
    setLoading(true);
    try {
      await register(form.email, form.password, form.username);
      toast.success("Welcome to NexChat!");
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚡</div>
          <h1>NexChat</h1>
          <p>Join the next generation of messaging</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>Username</label>
            <input type="text" placeholder="yourname"
              value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Email</label>
            <input type="email" placeholder="you@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <input type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}