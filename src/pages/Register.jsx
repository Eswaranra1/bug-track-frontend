import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";
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

function Register() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPw, setShowPw]   = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }
    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim() };
      await API.post("/auth/register", payload);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
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

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start tracking bugs in seconds</p>

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
            <label className="form-label">Full name</label>
            <input
              id="register-name"
              className="form-input"
              name="name"
              type="text"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="register-email"
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
            <label className="form-label">
              Password
              <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
                (min. 6 characters)
              </span>
            </label>
            <div className="input-icon-wrap">
              <input
                id="register-password"
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

            {/* Password strength bar */}
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 3, borderRadius: 4,
                  background: "var(--border)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: form.password.length >= 10 ? "100%"
                         : form.password.length >= 6  ? "60%"
                         : "25%",
                    background: form.password.length >= 10 ? "var(--green)"
                              : form.password.length >= 6  ? "var(--yellow)"
                              : "var(--red)",
                    transition: "all 0.3s ease",
                    borderRadius: 4,
                  }} />
                </div>
                <span style={{
                  fontSize: 11, marginTop: 4, display: "block",
                  color: form.password.length >= 10 ? "var(--green)"
                       : form.password.length >= 6  ? "var(--yellow)"
                       : "var(--red)",
                }}>
                  {form.password.length >= 10 ? "Strong"
                   : form.password.length >= 6  ? "Moderate"
                   : "Too short"}
                </span>
              </div>
            )}
          </div>

          <button id="register-submit" className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
