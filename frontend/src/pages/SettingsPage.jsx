// SettingsPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import { useBoards } from "../context/BoardsContext";
import mockTeam from "../data/mockTeam";

// TODO (M2 owner): replace with the real logged-in user's data once auth exists.
const CURRENT_USER = { name: "Sarah", email: "sarah@collabboard.dev" };

const SHORTCUTS = [
  { keys: "B", action: "Toggle sidebar" },
  { keys: "N", action: "New task on current board" },
  { keys: "/", action: "Focus search" },
  { keys: "Esc", action: "Close dialog / menu" },
  { keys: "G then B", action: "Go to Boards" },
  { keys: "G then D", action: "Go to Dashboard" },
];

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const mockTasks = useTasks();
  const { boards } = useBoards();
  const showToast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyActivity, setNotifyActivity] = useState(true);
  const [notifyWeekly, setNotifyWeekly] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MMM D");

  function handleSaveAccount(e) {
    e.preventDefault();
    // TODO (M2 owner): PATCH /api/users/me with { name, email }
    showToast("Account changes saved locally (not persisted yet)", "success");
  }

  function handleLogout() {
    // TODO (M2 owner): clear the real auth token/session before navigating.
    navigate("/login");
  }

  const [deleteStep, setDeleteStep] = useState(0); // 0 = idle, 1 = confirming

  function handleExportData() {
    // Real client-side export — everything here is mock data today, but the
    // export mechanism itself (build JSON, trigger a download) is genuine
    // and doesn't need a backend to work.
    const payload = {
      exportedAt: new Date().toISOString(),
      user: CURRENT_USER,
      boards: boards,
      tasks: mockTasks,
      team: mockTeam,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "collabboard-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Export downloaded", "success");
  }

  function handleDeleteAccount() {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    // TODO (M2 owner): real DELETE /api/users/me once auth + a database exist.
    // For now this simulates the end state of account deletion: signed out,
    // preference reset, sent to the login screen.
    localStorage.removeItem("collabboard-theme");
    navigate("/login");
  }

  return (
    <div className="page-shell">
      <h1 className="page-shell__title">Settings</h1>
      <p className="page-shell__subtitle">Manage your account, appearance, and notification preferences.</p>

      <div className="settings-columns">
        <section>
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

        <section>
          <h2 className="settings-section__title">Appearance</h2>
          <div className="settings-form">
            <div className="settings-theme-toggle">
              <button
                type="button"
                className={`settings-theme-btn ${theme === "light" ? "settings-theme-btn--active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
                Light
              </button>
              <button
                type="button"
                className={`settings-theme-btn ${theme === "dark" ? "settings-theme-btn--active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
                Dark
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="settings-section__title">Language &amp; region</h2>
          <div className="settings-form">
            <label className="settings-field">
              <span>Timezone</span>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Europe/London">London</option>
                <option value="Asia/Colombo">Colombo</option>
              </select>
            </label>
            <label className="settings-field">
              <span>Date format</span>
              <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                <option value="MMM D">Aug 21</option>
                <option value="D/M/YYYY">21/8/2026</option>
                <option value="M/D/YYYY">8/21/2026</option>
                <option value="YYYY-MM-DD">2026-08-21</option>
              </select>
            </label>
          </div>
        </section>

        <section>
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

        <section>
          <h2 className="settings-section__title">Keyboard shortcuts</h2>
          <div className="settings-form settings-shortcuts">
            {SHORTCUTS.map((s) => (
              <div className="settings-shortcut-row" key={s.action}>
                <span className="settings-shortcut-keys">{s.keys}</span>
                <span>{s.action}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="settings-section__title">Session</h2>
          <button className="settings-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </section>
      </div>

      <section className="settings-danger-zone">
        <h2 className="settings-section__title">Danger zone</h2>
        <div className="settings-danger-row">
          <div>
            <p className="settings-danger-row__title">Export your data</p>
            <p className="settings-danger-row__desc">Download all your boards and tasks as a JSON file.</p>
          </div>
          <button className="settings-outline-btn" onClick={handleExportData}>
            Export data
          </button>
        </div>
        <div className="settings-danger-row">
          <div>
            <p className="settings-danger-row__title">Delete account</p>
            <p className="settings-danger-row__desc">
              {deleteStep === 0
                ? "Permanently delete your account and all associated data."
                : "This can't be undone. Click again to confirm."}
            </p>
          </div>
          <div className="settings-danger-actions">
            {deleteStep === 1 && (
              <button className="settings-cancel-btn" onClick={() => setDeleteStep(0)}>
                Cancel
              </button>
            )}
            <button className="settings-logout-btn" onClick={handleDeleteAccount}>
              {deleteStep === 0 ? "Delete account" : "Confirm delete"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
