// NotificationsContext.jsx
// The second half of the notification bell, alongside InvitationsContext
// — this one is "FYI, something happened" (task assigned to you, board
// activity), not something you accept/decline. Same polling pattern as
// InvitationsContext, for the same reason (no websocket layer yet).
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as notificationsApi from "../api/notifications.js";

const POLL_MS = 20000;

const NotificationsStateContext = createContext(null);
const NotificationsActionsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef(null);

  const reload = useCallback(() => {
    return notificationsApi
      .fetchMyNotifications()
      .then(({ notifications, unreadCount }) => {
        setNotifications(notifications);
        setUnreadCount(unreadCount);
      })
      .catch(() => {
        /* best-effort — a failed poll just tries again next tick */
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
    intervalRef.current = setInterval(reload, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, [reload]);

  // Optimistic: flips locally right away so clicking a notification
  // feels instant, rather than waiting on the round trip.
  const markRead = async (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await notificationsApi.markNotificationRead(id);
    } catch {
      reload(); // out of sync with the server — resync instead of guessing
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllNotificationsRead();
    } catch {
      reload();
    }
  };

  return (
    <NotificationsStateContext.Provider value={{ notifications, unreadCount, isLoading }}>
      <NotificationsActionsContext.Provider value={{ markRead, markAllRead, reload }}>
        {children}
      </NotificationsActionsContext.Provider>
    </NotificationsStateContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsStateContext);
}

export function useNotificationsActions() {
  return useContext(NotificationsActionsContext);
}
