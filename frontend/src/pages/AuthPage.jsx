import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { LOGO_ICON, ILLUSTRATION, AUTH_BG } from "../assets/cdn.js";
import "../styles/authSlide.css";

const SLIDE_TRANSITION = { type: "spring", stiffness: 260, damping: 30 };
const FADE_TRANSITION = { duration: 0.2 };

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

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const showToast = useToast();

  // The URL is the source of truth for which form shows — /login vs
  // /signup — so a refresh or a direct link always lands on the right
  // side, and toggling just navigates rather than only flipping local state.
  const isLogin = location.pathname !== "/signup";

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (location.state?.justReset) {
      showToast("Password updated — log in with your new password.", "success");
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = useCallback(
    (path) => {
      setError("");
      setShowPw(false);
      setShowConfirm(false);
      navigate(path);
    },
    [navigate]
  );

  const updateLogin = (key) => (e) => setLoginForm((f) => ({ ...f, [key]: e.target.value }));
  const updateSignup = (key) => (e) => setSignupForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitted(true);
    try {
      await login(loginForm.email, loginForm.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setSubmitted(false);
    }
  }

  async function handleSignupSubmit(e) {
    e.preventDefault();
    setError("");

    if (signupForm.password !== signupForm.confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitted(true);
    try {
      await register(signupForm.name, signupForm.email, signupForm.password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setSubmitted(false);
    }
  }

  return (
    <div className="as-page">
      <div className="as-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="as-bg-overlay" aria-hidden="true" />

      <div className="as-card">
        <div className="as-inner">
          {/* Brand / showcase panel — slides to whichever side isn't the active form */}
          <motion.div
            className="as-showcase"
            initial={false}
            animate={{ left: isLogin ? "52%" : "0%" }}
            transition={SLIDE_TRANSITION}
          >
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
          </motion.div>

          {/* Form panel — slides opposite the showcase panel */}
          <motion.div
            className="as-formpanel"
            initial={false}
            animate={{ left: isLogin ? "0%" : "52%" }}
            transition={SLIDE_TRANSITION}
          >
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={FADE_TRANSITION}
                >
                  <h1 className="as-heading">Welcome back</h1>
                  <p className="as-heading-sub">Log in to pick up where your team left off.</p>

                  <form className="as-form" onSubmit={handleLoginSubmit}>
                    <Field
                      id="email"
                      label="Email"
                      type="email"
                      value={loginForm.email}
                      onChange={updateLogin("email")}
                      autoComplete="email"
                    />
                    <Field
                      id="password"
                      label="Password"
                      type={showPw ? "text" : "password"}
                      value={loginForm.password}
                      onChange={updateLogin("password")}
                      autoComplete="current-password"
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

                    <button
                      type="button"
                      className="as-forgot"
                      onClick={() => navigate("/forgot-password")}
                    >
                      Forgot password?
                    </button>

                    {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="as-error">{error}</motion.p>}

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      className="as-cta"
                      disabled={submitted}
                    >
                      {submitted ? "Logging in…" : "Log in"}
                    </motion.button>
                  </form>

                  <p className="as-switch">
                    Don't have an account?{" "}
                    <button type="button" className="as-switch-link" onClick={() => goTo("/signup")}>
                      Sign up
                    </button>
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={FADE_TRANSITION}
                >
                  <h1 className="as-heading">Create account</h1>
                  <p className="as-heading-sub">Built for small, fast-moving teams.</p>

                  <form className="as-form" onSubmit={handleSignupSubmit}>
                    <Field id="name" label="Name" value={signupForm.name} onChange={updateSignup("name")} autoComplete="name" />
                    <Field
                      id="signup-email"
                      label="Email"
                      type="email"
                      value={signupForm.email}
                      onChange={updateSignup("email")}
                      autoComplete="email"
                    />
                    <Field
                      id="signup-password"
                      label="Password"
                      type={showPw ? "text" : "password"}
                      value={signupForm.password}
                      onChange={updateSignup("password")}
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
                      id="confirm"
                      label="Confirm password"
                      type={showConfirm ? "text" : "password"}
                      value={signupForm.confirm}
                      onChange={updateSignup("confirm")}
                      autoComplete="new-password"
                      adornment={
                        <button
                          type="button"
                          className="as-peek"
                          onClick={() => setShowConfirm((s) => !s)}
                          aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />

                    {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="as-error">{error}</motion.p>}

                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      type="submit"
                      className="as-cta"
                      disabled={submitted}
                    >
                      {submitted ? "Creating account…" : "Create account"}
                    </motion.button>
                  </form>

                  <p className="as-switch">
                    Already have an account?{" "}
                    <button type="button" className="as-switch-link" onClick={() => goTo("/login")}>
                      Log in
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}