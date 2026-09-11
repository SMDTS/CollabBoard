import { useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import * as authApi from "../api/auth.js";
import { LOGO_ICON, ILLUSTRATION, AUTH_BG } from "../assets/cdn.js";
import "../styles/authSlide.css";

function Field({ id, label, type = "text", value, onChange, adornment, autoComplete }) {
  return (
    <div className="as-field">
      <label htmlFor={id} className="as-field-label">{label}</label>
      <div className="as-field-row">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="as-field-input"
          required
        />
        {adornment}
      </div>
    </div>
  );
}

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
    <div className="as-page">
      <div className="as-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="as-bg-overlay" aria-hidden="true" />

      <div className="as-card">
        <div className="as-inner">
          {/* Brand showcase panel */}
          <div className="as-showcase" style={{ left: "52%" }}>
            <div className="as-brand">
              <img src={LOGO_ICON} alt="" className="as-brand-mark" />
              <span className="as-brand-name">Flowty</span>
            </div>
            <h2 className="as-showcase-title">Where scattered work becomes a plan.</h2>
            <p className="as-showcase-sub">
              Flowty pulls every task, note and deadline into one shared board, so everyone
              knows what's next without a status meeting.
            </p>
            <ul className="as-proof">
              <li><Check size={14} strokeWidth={3} /> Unlimited boards</li>
              <li><Check size={14} strokeWidth={3} /> Offline-ready</li>
            </ul>
            <img src={ILLUSTRATION} alt="" className="as-illustration" aria-hidden="true" />
          </div>

          {/* Form panel */}
          <div className="as-formpanel" style={{ left: "0%" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="as-heading">Set a new password</h1>
              <p className="as-heading-sub" style={{ marginBottom: 24 }}>
                Enter your new password below.
              </p>

              {!token && (
                <p className="as-error" style={{ marginBottom: 16 }}>
                  This link is missing its reset token — open the link from your email again, or request a new one.
                </p>
              )}

              <form className="as-form" onSubmit={handleSubmit}>
                <Field
                  id="password"
                  label="New password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  adornment={
                    <button
                      type="button"
                      className="as-peek"
                      onClick={() => setShowPw((s) => !s)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  }
                />
                <Field
                  id="confirmPassword"
                  label="Confirm new password"
                  type={showPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />

                {error && <p className="as-error">{error}</p>}

                <button type="submit" className="as-cta" disabled={submitted || !token}>
                  {submitted ? "Updating…" : "Update password"}
                </button>
              </form>

              <p className="as-switch">
                <Link to="/login" className="as-switch-link">Back to log in</Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
