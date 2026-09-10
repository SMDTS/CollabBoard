import { useState } from "react";
import { Eye, EyeOff, Sparkles, Check } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import * as authApi from "../api/auth.js";
import BG_SHAPE from "../assets/auth/bg-shape.png";
import LOGO_ICON from "../assets/auth/logo-icon.png";
import ILLUSTRATION from "../assets/auth/illustration.png";
import "../styles/auth.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitted(true);
    try {
      await authApi.resetPassword(token, password);
      navigate("/login", { state: { justReset: true } });
    } catch (err) {
      setError(err.message || "This reset link is invalid or has expired.");
      setSubmitted(false);
    }
  };

  return (
    <div className="ft-page">
      <div className="ft-bg" style={{ backgroundImage: `url(${BG_SHAPE})` }} aria-hidden="true" />

      <section className="ft-hero">
        <div className="ft-blob ft-blob-a" />
        <div className="ft-blob ft-blob-b" />

        <div className="ft-hero-inner">
          <div className="ft-brand">
            <img src={LOGO_ICON} alt="" className="ft-brand-mark" />
            <span className="ft-brand-name">Flowty</span>
          </div>

          <div className="ft-hero-text">
            <div className="ft-hero-copy">
              <p className="ft-eyebrow"><Sparkles size={13} strokeWidth={2.4} /> Account recovery</p>
              <h1>Where scattered work<br />becomes a plan.</h1>
              <p className="ft-sub">
                Flowty pulls every task, note and deadline into one shared board,
                so everyone knows what's next without a status meeting.
              </p>
            </div>

            <ul className="ft-proof">
              <li><Check size={14} strokeWidth={3} /> Unlimited boards</li>
              <li><Check size={14} strokeWidth={3} /> Real-time sync</li>
            </ul>
          </div>

          <div className="ft-hero-media">
            <img src={ILLUSTRATION} alt="Team reviewing a shared checklist together" className="ft-illustration" />
          </div>
        </div>
      </section>

      <section className="ft-panel">
        <div className="ft-card">
          <h2 className="ft-heading">Set a new password</h2>

          {!token && (
            <p className="ft-error" style={{ marginBottom: 16 }}>
              This link is missing its reset token — open the link from your email again, or request a new one.
            </p>
          )}

          <form className="ft-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="password" className="field-label">New password</label>
              <div className="field-row">
                <input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="field-input"
                />
                <button
                  type="button"
                  className="ft-peek"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="confirmPassword" className="field-label">Confirm new password</label>
              <div className="field-row">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="field-input"
                />
              </div>
            </div>

            {error && <p className="ft-error">{error}</p>}

            <div className="ft-actions">
              <button type="submit" className="ft-cta" disabled={submitted || !token}>
                {submitted ? "Updating…" : "Update password"}
              </button>
            </div>
          </form>

          <p className="ft-switch">
            <Link to="/login">Back to log in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
