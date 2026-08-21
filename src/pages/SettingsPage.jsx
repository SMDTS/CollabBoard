// SettingsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// TODO (M2 owner): replace with the real logged-in user's data once auth exists.
const CURRENT_USER = { name: "Sarah", email: "sarah@collabboard.dev" };

function SettingsPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(CURRENT_USER.name);
  const [email, setEmail] = useState(CURRENT_USER.email);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyActivity, setNotifyActivity] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);

  function handleSaveAccount(e) {
    e.preventDefault();
    // TODO (M2 owner): PATCH /api/users/me with { name, email }
  }

  function handleLogout() {
    // TODO (M2 owner): clear the real auth token/session before navigating.
    navigate("/login");
  }

  return (
    <div className="settings-page">
      <h1 className="settings-page__title">Settings</h1>
      <p className="settings-page__subtitle">
        Account and notification preferences. Saving doesn't persist yet — real auth comes at M2.
      </p>

      <section className="settings-section">
        <h2 className="settings-section__title">Account</h2>
        <form className="settings-form" onSubmit={handleSaveAccount}>
          <label className="settings-field">
            <span>Display name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="settings-field">
            <span>Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="settings-save-btn">
            Save changes
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Notifications</h2>
        <div className="settings-toggles">
          <label className="settings-toggle">
            <input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
            <span>Email me when I'm assigned a task</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={notifyActivity} onChange={(e) => setNotifyActivity(e.target.checked)} />
            <span>Notify me on board activity</span>
          </label>
          <label className="settings-toggle">
            <input type="checkbox" checked={notifyWeekly} onChange={(e) => setNotifyWeekly(e.target.checked)} />
            <span>Send a weekly summary email</span>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">Session</h2>
        <button className="settings-logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </section>
    </div>
  );
}

export default SettingsPage;