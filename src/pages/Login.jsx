import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { saveToken } from "../utils/auth";
import { useTheme } from "../utils/theme";

/* ── Inline SVG Icons ── */
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent]   = useState(false);
  const { theme, toggleTheme }  = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim() };
      const res = await API.post("/auth/login", payload);
      saveToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: forgotEmail.trim() });
      setForgotSent(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send reset email. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title="Toggle theme"
        style={{
          position: "fixed", top: 16, right: 16,
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "50%", width: 38, height: 38,
          cursor: "pointer", fontSize: 18, display: "grid", placeItems: "center",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🐛</div>
          <span className="auth-logo-text">Bug<span>Track</span></span>
        </div>

        {/* ── Forgot password mode ── */}
        {forgotMode ? (
          <>
            <h1 className="auth-title">Reset password</h1>
            <p className="auth-subtitle">
              {forgotSent
                ? "Check your inbox for a reset link."
                : "Enter your email and we'll send a reset link."}
            </p>

            {!forgotSent ? (
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    autoComplete="email"
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            ) : (
              <div style={{
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "var(--green)",
                marginBottom: 16,
              }}>
                ✓ Reset link sent to <strong>{forgotEmail}</strong>
              </div>
            )}

            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(""); }}
            >
              ← Back to sign in
            </button>
          </>
        ) : (
          /* ── Normal login mode ── */
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your workspace</p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  id="login-email"
                  className="form-input"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: 12, color: "var(--accent-light)", fontFamily: "inherit",
                      padding: 0, marginBottom: 4,
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-icon-wrap">
                  <input
                    id="login-password"
                    className="form-input"
                    name="password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    className="eye-toggle"
                    onClick={() => setShowPw((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button id="login-submit" className="btn btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <div className="auth-footer">
              Don't have an account? <Link to="/register">Create one</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
