import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import { useBoards } from "../context/BoardsContext";
import { useUsers } from "../context/UsersContext";
import { updateMyPreferences, uploadAvatarFile, updateAvatarUrl } from "../api/users.js";
import { avatarColor } from "../utils/avatarColor";
import { AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "../components/UserAvatar.jsx";

const SHORTCUTS = [
  { keys: "B", action: "Toggle sidebar" },
  { keys: "N", action: "New task on current board" },
  { keys: "/", action: "Focus search" },
  { keys: "Esc", action: "Close dialog / menu" },
  { keys: "⌘ + B", action: "Go to Boards" },
  { keys: "⌘ + D", action: "Go to Dashboard" },
];

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, logout, updateUser } = useAuth();
  const mockTasks = useTasks();
  const { boards } = useBoards();
  const { users } = useUsers();
  const showToast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [deleteStep, setDeleteStep] = useState(0);

  const [emailNotifs, setEmailNotifs] = useState(user?.preferences?.emailNotifs ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(user?.preferences?.inAppNotifs ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(user?.preferences?.weeklyDigest ?? false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MMM D");

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be smaller than 5MB", "error");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const updatedUser = await uploadAvatarFile(file);
      updateUser(updatedUser);
      setAvatarUrlInput(updatedUser.avatarUrl || "");
      showToast("Profile picture updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSaveAvatarUrl(e) {
    e.preventDefault();
    try {
      const updatedUser = await updateAvatarUrl(avatarUrlInput.trim() || null);
      updateUser(updatedUser);
      showToast("Profile picture updated", "success");
    } catch (err) {
      showToast(err.message || "Failed to update profile picture URL", "error");
    }
  }

  async function handleRemoveAvatar() {
    try {
      const updatedUser = await updateAvatarUrl(null);
      updateUser(updatedUser);
      setAvatarUrlInput("");
      showToast("Profile picture removed", "info");
    } catch (err) {
      showToast("Failed to remove profile picture", "error");
    }
  }

  function handleSaveAccount(e) {
    e.preventDefault();
    updateUser({ name, email });
    showToast("Account changes saved", "success");
  }

  async function handleTogglePref(key, value, setter) {
    const prev = { emailNotifs, inAppNotifs, weeklyDigest };
    setter(value);
    const next = { ...prev, [key]: value };

    setIsSavingPrefs(true);
    try {
      await updateMyPreferences(next);
      updateUser({ preferences: next });
      showToast("Notification settings updated", "success");
    } catch (err) {
      setter(!value);
      showToast(err.message || "Couldn't save preferences", "error");
    } finally {
      setIsSavingPrefs(false);
    }
  }

  function handleExportData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: user,
      boards: boards,
      tasks: mockTasks,
      team: users,
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
    logout();
    localStorage.removeItem("collabboard-theme");
    showToast("Account deleted", "info");
    navigate("/login");
  }

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <motion.div
      className="page-shell bp2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      <motion.div
        className="bp2-frame settings-frame"
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="settings-header">
          <div className="settings-header__profile">
            <div className="settings-header__avatar-wrapper" style={{ position: "relative", display: "inline-block" }}>
              <UserAvatar user={user} size={64} className="settings-header__avatar-img" />
              <label
                htmlFor="settings-avatar-file-input"
                className="settings-avatar-badge"
                title="Upload profile picture"
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#8b6ff2",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
              <input
                id="settings-avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
            </div>
            <div>
              <h1 className="settings-header__title">{user?.name || "Settings"}</h1>
              <p className="settings-header__subtitle">{user?.email || "Manage your account & preferences"}</p>
              {isUploadingAvatar && <p style={{ fontSize: 12, color: "#8b6ff2", margin: "4px 0 0", fontWeight: 600 }}>Uploading image…</p>}
            </div>
          </div>
        </div>

        <div className="settings-grid">
          <div className="settings-col">
            {/* Account Card */}
            <motion.section className="settings-card" whileHover={{ y: -2 }}>
              <div className="settings-card__header">
                <div className="settings-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card__title">Account Information</h2>
                  <p className="settings-card__subtitle">Update your personal profile details</p>
                </div>
              </div>

              <form className="settings-form" onSubmit={handleSaveAccount}>
                <div className="settings-field">
                  <label htmlFor="settings-name">Display Name</label>
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="settings-field">
                  <label htmlFor="settings-email">Email Address</label>
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-avatar-url">Profile Picture URL (Web Image)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      id="settings-avatar-url"
                      type="url"
                      value={avatarUrlInput}
                      onChange={(e) => setAvatarUrlInput(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                    />
                    <button type="button" className="settings-btn settings-btn--ghost" onClick={handleSaveAvatarUrl}>
                      Apply
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 4 }}>
                  <button type="submit" className="settings-btn settings-btn--primary">
                    Save Account
                  </button>
                  {user?.avatarUrl && (
                    <button type="button" className="settings-btn settings-btn--danger" onClick={handleRemoveAvatar}>
                      Remove Picture
                    </button>
                  )}
                </div>
              </form>
            </motion.section>

            {/* Appearance Card */}
            <motion.section className="settings-card" whileHover={{ y: -2 }}>
              <div className="settings-card__header">
                <div className="settings-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card__title">Appearance & Region</h2>
                  <p className="settings-card__subtitle">Customize application theme and locale</p>
                </div>
              </div>

              <div className="settings-form">
                <div className="settings-field">
                  <label>Theme</label>
                  <div className="settings-theme-pills">
                    <button
                      type="button"
                      className={`settings-theme-pill ${theme === "light" ? "settings-theme-pill--active" : ""}`}
                      onClick={() => setTheme("light")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                      </svg>
                      Light
                    </button>
                    <button
                      type="button"
                      className={`settings-theme-pill ${theme === "dark" ? "settings-theme-pill--active" : ""}`}
                      onClick={() => setTheme("dark")}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                      </svg>
                      Dark
                    </button>
                  </div>
                </div>

                <div className="settings-field-group">
                  <div className="settings-field">
                    <label htmlFor="settings-tz">Timezone</label>
                    <select id="settings-tz" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (US)</option>
                      <option value="America/Los_Angeles">Pacific Time (US)</option>
                      <option value="Europe/London">London</option>
                      <option value="Asia/Colombo">Colombo</option>
                    </select>
                  </div>
                  <div className="settings-field">
                    <label htmlFor="settings-date-format">Date Format</label>
                    <select id="settings-date-format" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                      <option value="MMM D">Aug 21</option>
                      <option value="D/M/YYYY">21/8/2026</option>
                      <option value="M/D/YYYY">8/21/2026</option>
                      <option value="YYYY-MM-DD">2026-08-21</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          <div className="settings-col">
            {/* Notifications Card */}
            <motion.section className="settings-card" whileHover={{ y: -2 }}>
              <div className="settings-card__header">
                <div className="settings-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card__title">Notifications</h2>
                  <p className="settings-card__subtitle">Choose how you want to receive updates</p>
                </div>
              </div>

              <div className="settings-switches">
                <label className="settings-switch">
                  <div className="settings-switch__info">
                    <span className="settings-switch__title">Task Assignment</span>
                    <span className="settings-switch__desc">Email me when I'm assigned a task</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailNotifs}
                    disabled={isSavingPrefs}
                    onChange={(e) => handleTogglePref("emailNotifs", e.target.checked, setEmailNotifs)}
                  />
                  <span className="settings-switch__slider" />
                </label>

                <label className="settings-switch">
                  <div className="settings-switch__info">
                    <span className="settings-switch__title">Board Activity</span>
                    <span className="settings-switch__desc">Notify me on board activity & updates</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={inAppNotifs}
                    disabled={isSavingPrefs}
                    onChange={(e) => handleTogglePref("inAppNotifs", e.target.checked, setInAppNotifs)}
                  />
                  <span className="settings-switch__slider" />
                </label>

                <label className="settings-switch">
                  <div className="settings-switch__info">
                    <span className="settings-switch__title">Weekly Digest</span>
                    <span className="settings-switch__desc">Send a weekly summary report email</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    disabled={isSavingPrefs}
                    onChange={(e) => handleTogglePref("weeklyDigest", e.target.checked, setWeeklyDigest)}
                  />
                  <span className="settings-switch__slider" />
                </label>
              </div>
            </motion.section>

            {/* Keyboard Shortcuts Card */}
            <motion.section className="settings-card" whileHover={{ y: -2 }}>
              <div className="settings-card__header">
                <div className="settings-card__icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8" />
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card__title">Keyboard Shortcuts</h2>
                  <p className="settings-card__subtitle">Speed up your workflow</p>
                </div>
              </div>

              <div className="settings-shortcuts-grid">
                {SHORTCUTS.map((s) => (
                  <div className="settings-shortcut-row" key={s.action}>
                    <span className="settings-shortcut-action">{s.action}</span>
                    <kbd className="settings-kbd">{s.keys}</kbd>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Danger Zone Card */}
            <motion.section className="settings-card settings-card--danger" whileHover={{ y: -2 }}>
              <div className="settings-card__header">
                <div className="settings-card__icon settings-card__icon--danger">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div>
                  <h2 className="settings-card__title" style={{ color: "#f87171" }}>Account Actions</h2>
                  <p className="settings-card__subtitle">Export data or delete account</p>
                </div>
              </div>

              <div className="settings-danger-list">
                <div className="settings-danger-item">
                  <div>
                    <span className="settings-danger-title">Export Workspace Data</span>
                    <span className="settings-danger-desc">Download boards, tasks, and settings as JSON</span>
                  </div>
                  <button type="button" className="settings-btn settings-btn--ghost" onClick={handleExportData}>
                    Export JSON
                  </button>
                </div>

                <div className="settings-danger-item">
                  <div>
                    <span className="settings-danger-title">Log Out</span>
                    <span className="settings-danger-desc">Sign out of your active session</span>
                  </div>
                  <button type="button" className="settings-btn settings-btn--ghost" onClick={handleLogout}>
                    Log Out
                  </button>
                </div>

                <div className="settings-danger-item">
                  <div>
                    <span className="settings-danger-title" style={{ color: "#f87171" }}>Delete Account</span>
                    <span className="settings-danger-desc">
                      {deleteStep === 0
                        ? "Permanently remove your account and data"
                        : "Action cannot be undone. Click again to confirm"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {deleteStep === 1 && (
                      <button type="button" className="settings-btn settings-btn--ghost" onClick={() => setDeleteStep(0)}>
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      className="settings-btn settings-btn--danger"
                      onClick={handleDeleteAccount}
                    >
                      {deleteStep === 0 ? "Delete Account" : "Confirm Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SettingsPage;

