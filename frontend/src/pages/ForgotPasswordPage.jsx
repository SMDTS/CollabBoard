import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth.js";
import { LOGO_ICON, ILLUSTRATION, AUTH_BG } from "../assets/cdn.js";
import "../styles/authSlide.css";

function Field({ id, label, type = "text", value, onChange, autoComplete }) {
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
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
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
              {sent ? (
                <>
                  <h1 className="as-heading">Check your email</h1>
                  <p className="as-heading-sub" style={{ marginBottom: 24 }}>
                    If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                    It expires in 1 hour.
                  </p>
                  <p className="as-switch">
                    <Link to="/login" className="as-switch-link">Back to log in</Link>
                  </p>
                </>
              ) : (
                <>
                  <h1 className="as-heading">Forgot password?</h1>
                  <p className="as-heading-sub" style={{ marginBottom: 24 }}>
                    Enter the email on your account and we'll send you a link to reset your password.
                  </p>

                  <form className="as-form" onSubmit={handleSubmit}>
                    <Field
                      id="email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />

                    {error && <p className="as-error">{error}</p>}

                    <button type="submit" className="as-cta" disabled={submitted}>
                      {submitted ? "Sending…" : "Send reset link"}
                    </button>
                  </form>

                  <p className="as-switch">
                    Remembered it?{" "}
                    <Link to="/login" className="as-switch-link">Log in</Link>
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
