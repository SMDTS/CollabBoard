// TopBar.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// TODO (M2 owner): replace with the real logged-in user once auth exists.
const CURRENT_USER = { name: "Sarah", initials: "S" };

// TODO (M5 owner): replace with a real notification count once Socket.io/activity exists.
const NOTIFICATION_COUNT = 3;

function formatDateTime(date) {
  const dateStr = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function TopBar() {
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar__datetime">{formatDateTime(now)}</div>

      <div className="topbar__right">
        <button className="topbar__icon-btn" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          {NOTIFICATION_COUNT > 0 && <span className="topbar__badge">{NOTIFICATION_COUNT}</span>}
        </button>

        <div className="topbar__profile">
          <button className="topbar__avatar" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Profile menu">
            {CURRENT_USER.initials}
          </button>

          {menuOpen && (
            <div className="topbar__menu" onMouseLeave={() => setMenuOpen(false)}>
              <div className="topbar__menu-name">{CURRENT_USER.name}</div>
              <button
                className="topbar__menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/settings");
                }}
              >
                Settings
              </button>
              <button
                className="topbar__menu-item topbar__menu-item--danger"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
              >
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
