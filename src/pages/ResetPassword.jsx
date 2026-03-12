import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useTheme } from "../utils/theme";

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

function ResetPassword() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCfm,   setShowCfm]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) return setError("Password must be at least 6 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      await API.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length >= 10 ? "Strong"
                 : password.length >= 6  ? "Moderate"
                 : password.length > 0   ? "Too short"
                 : "";

  const strengthColor = password.length >= 10 ? "var(--green)"
                      : password.length >= 6  ? "var(--yellow)"
                      : "var(--red)";

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

        {success ? (
          /* ── Success State ── */
          <>
            <div style={{
              background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 10, padding: "20px", textAlign: "center", marginBottom: 20,
            }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Password reset!</h2>
              <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                Redirecting you to sign in…
              </p>
            </div>
            <Link to="/" className="btn btn-ghost" style={{ width: "100%", textAlign: "center" }}>
              Go to Sign in
            </Link>
          </>
        ) : (
          /* ── Form ── */
          <>
            <h1 className="auth-title">Choose a new password</h1>
            <p className="auth-subtitle">Must be at least 6 characters</p>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ef4444",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div className="form-group">
                <label className="form-label">New password</label>
                <div className="input-icon-wrap">
                  <input
                    className="form-input"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    required
                    style={{ paddingRight: 44 }}
                  />
                  <button type="button" className="eye-toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                {/* Strength bar */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 3, borderRadius: 4, background: "var(--border)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4, transition: "all 0.3s ease",
                        width: password.length >= 10 ? "100%" : password.length >= 6 ? "60%" : "25%",
                        background: strengthColor,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, marginTop: 4, display: "block", color: strengthColor }}>
                      {strength}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <div className="input-icon-wrap">
                  <input
                    className="form-input"
                    type={showCfm ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                    required
                    style={{
                      paddingRight: 44,
                      borderColor: confirm && confirm !== password ? "var(--red)" : undefined,
                    }}
                  />
                  <button type="button" className="eye-toggle" onClick={() => setShowCfm(v => !v)} tabIndex={-1}>
                    {showCfm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirm && confirm !== password && (
                  <span style={{ fontSize: 11, color: "var(--red)", marginTop: 4 }}>
                    Passwords don't match
                  </span>
                )}
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || password !== confirm || password.length < 6}
              >
                {loading ? "Resetting…" : "Reset Password →"}
              </button>
            </form>

            <div className="auth-footer">
              <Link to="/">← Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
