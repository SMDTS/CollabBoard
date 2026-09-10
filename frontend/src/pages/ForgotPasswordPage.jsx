import { useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth.js";
import BG_SHAPE from "../assets/auth/bg-shape.png";
import LOGO_ICON from "../assets/auth/logo-icon.png";
import ILLUSTRATION from "../assets/auth/illustration.png";
import "../styles/auth.css";

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
      // Always show the same "check your email" state, whether or not the
      // address is actually registered — the backend gives the same
      // response either way on purpose, so the UI shouldn't leak it either.
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
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
          {sent ? (
            <>
              <h2 className="ft-heading">Check your email</h2>
              <p className="ft-sub" style={{ marginBottom: 24 }}>
                If an account exists for <strong>{email}</strong>, a password reset link is on its way.
                It expires in 1 hour.
              </p>
              <p className="ft-switch">
                <Link to="/login">Back to log in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="ft-heading">Forgot password?</h2>
              <p className="ft-sub" style={{ marginBottom: 24 }}>
                Enter the email on your account and we'll send you a link to reset your password.
              </p>

              <form className="ft-form" onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="email" className="field-label">Email</label>
                  <div className="field-row">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="field-input"
                    />
                  </div>
                </div>

                {error && <p className="ft-error">{error}</p>}

                <div className="ft-actions">
                  <button type="submit" className="ft-cta" disabled={submitted}>
                    {submitted ? "Sending…" : "Send reset link"}
                  </button>
                </div>
              </form>

              <p className="ft-switch">
                Remembered it? <Link to="/login">Log in</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
