import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useInvitations, useInvitationsActions } from "../context/InvitationsContext";
import { useNotifications, useNotificationsActions } from "../context/NotificationsContext";
import { useToast } from "../context/ToastContext";
import { AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "./UserAvatar.jsx";

function formatDateTime(date) {
  const dateStr = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const timeStr = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${dateStr} · ${timeStr}`;
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function TopBar({ onOpenSearch }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { invitations } = useInvitations();
  const { respond } = useInvitationsActions();
  const { notifications, unreadCount } = useNotifications();
  const { markRead, markAllRead } = useNotificationsActions();
  const showToast = useToast();
  const [now, setNow] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);

  const badgeCount = invitations.length + unreadCount;

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  async function handleRespond(id, action, boardName) {
    setRespondingId(id);
    try {
      await respond(id, action);
      showToast(
        action === "accept" ? `Joined "${boardName}"` : `Declined invite to "${boardName}"`,
        "success"
      );
    } catch (err) {
      showToast(err.message || "Couldn't respond to that invite", "error");
    } finally {
      setRespondingId(null);
    }
  }

  function handleOpenNotification(notification) {
    if (!notification.read) markRead(notification.id);
    setNotifOpen(false);
    navigate(notification.link);
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar topbar--mirror">
      <div className="topbar__bg" aria-hidden="true">
        <div className="topbar__bg-img" style={{ backgroundImage: `url(${AUTH_BG})` }} />
        <div className="topbar__bg-overlay" />
      </div>
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

        <div className="topbar__notif">
          <button
            className="topbar__icon-btn"
            aria-label="Notifications"
            onClick={() => setNotifOpen((prev) => !prev)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            {badgeCount > 0 && <span className="topbar__badge">{badgeCount}</span>}
          </button>

          {notifOpen && (
            <div className="topbar__notif-menu" onMouseLeave={() => setNotifOpen(false)}>
              <div className="topbar__notif-title">Board invitations</div>
              {invitations.length === 0 ? (
                <div className="topbar__notif-empty">No pending invitations.</div>
              ) : (
                invitations.map((inv) => (
                  <div className="topbar__notif-item" key={inv.id}>
                    <div className="topbar__notif-text">
                      <strong>{inv.invitedByName}</strong> invited you to <strong>{inv.boardName}</strong>
                    </div>
                    <div className="topbar__notif-actions">
                      <button
                        className="topbar__notif-btn topbar__notif-btn--accept"
                        disabled={respondingId === inv.id}
                        onClick={() => handleRespond(inv.id, "accept", inv.boardName)}
                      >
                        Accept
                      </button>
                      <button
                        className="topbar__notif-btn"
                        disabled={respondingId === inv.id}
                        onClick={() => handleRespond(inv.id, "decline", inv.boardName)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}

              <div className="topbar__notif-title topbar__notif-title--row">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="topbar__notif-mark-all" onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="topbar__notif-empty">Nothing yet.</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={`topbar__notif-item topbar__notif-item--clickable ${n.read ? "" : "topbar__notif-item--unread"}`}
                    onClick={() => handleOpenNotification(n)}
                  >
                    <div className="topbar__notif-text">
                      {!n.read && <span className="topbar__notif-dot" aria-hidden="true" />}
                      {n.message}
                    </div>
                    <span className="topbar__notif-time">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="topbar__profile">
          <button className="topbar__avatar" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Profile menu" style={{ padding: 0, overflow: "hidden", borderRadius: "50%", background: "none", border: "none" }}>
            <UserAvatar user={user} size={32} />
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