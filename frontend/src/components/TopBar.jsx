// TopBar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

// TODO (M5 owner): replace with a real notification count once Socket.io/activity exists.
const NOTIFICATION_COUNT = 3;

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function formatDateTime(date) {
  const dateStr = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function TopBar({ onOpenSearch }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar__datetime">{formatDateTime(now)}</div>

      <button className="topbar__search" onClick={onOpenSearch}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span className="topbar__search-placeholder">Search boards, tasks…</span>
        <span className="topbar__search-kbd">{isMac ? "⌘K" : "Ctrl K"}</span>
      </button>

      <div className="topbar__right">
        <button
          className="topbar__icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
          ) : (
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        <button className="topbar__icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {NOTIFICATION_COUNT > 0 && <span className="topbar__badge">{NOTIFICATION_COUNT}</span>}
        </button>

        <div className="topbar__profile">
          <button className="topbar__avatar" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Profile menu">
            {initials(user?.name)}
          </button>

          {menuOpen && (
            <div className="topbar__menu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="topbar__menu-name">{user?.name || "Account"}</div>
              <button
                className="topbar__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
              >
                Settings
              </button>
              <button className="topbar__menu-item topbar__menu-item--danger" onClick={handleLogout}>
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;
