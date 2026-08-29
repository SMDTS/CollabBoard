import React, { useState } from "react";
import { Eye, EyeOff, Sparkles, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BG_SHAPE from "../assets/auth/bg-shape.png";
import LOGO_ICON from "../assets/auth/logo-icon.png";
import ILLUSTRATION from "../assets/auth/illustration.png";
import "../styles/auth.css";


function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function Field({ id, label, type = "text", value, onChange, adornment, autoComplete }) {
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      <div className="field-row">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="field-input"
        />
        {adornment}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
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
              <span className="ft-brand-name">CollabBoard</span>
            </div>

            <div className="ft-hero-text">
              <div className="ft-hero-copy">
                <p className="ft-eyebrow"><Sparkles size={13} strokeWidth={2.4} /> Welcome back</p>
                <h1>Where scattered work<br />becomes a plan.</h1>
                <p className="ft-sub">
                  CollabBoard pulls every task, note and deadline into one shared board,
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
            <h2 className="ft-heading">Log In</h2>

            <form className="ft-form" onSubmit={handleSubmit}>
              <Field id="email" label="Email" type="email" value={form.email} onChange={update("email")} autoComplete="email" />
              <Field
                id="password"
                label="Password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                autoComplete="current-password"
                adornment={
                  <button type="button" className="ft-peek" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />

              <a href="#" className="ft-forgot">Forgot password?</a>

              {error && <p className="ft-error">{error}</p>}

              <div className="ft-actions">
                <button type="submit" className="ft-cta" disabled={submitted}>
                  {submitted ? "Logging in…" : "Log In"}
                </button>

                <button type="button" className="ft-google">
                  <GoogleMark /> Continue with Google
                </button>
              </div>
            </form>

            <p className="ft-switch">Don't have an account? <Link to="/signup">Sign up</Link></p>
          </div>
        </section>
      </div>
  );
}