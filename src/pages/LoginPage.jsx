import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // TODO (M2 owner): real auth call goes here
    navigate("/");
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__logo">CollabBoard</div>
        <p className="login-card__subtitle">Log in to your workspace</p>

        <label className="login-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </label>

        <label className="login-field">
          <span>Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </label>

        <button type="submit" className="login-submit">Log in</button>
        <p className="login-card__footer">Don't have an account? Sign up (coming soon)</p>
      </form>
    </div>
  );
}

export default LoginPage;