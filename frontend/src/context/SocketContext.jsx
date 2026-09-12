// SocketContext.jsx
//
// One socket connection for the whole app, alongside (not instead of) the
// existing PouchDB offline-sync loop. Incoming task events are written
// straight into PouchDB via the same merge helpers the polling sync uses
// (see db/tasksSync.js) — the live `changes` feed TasksContext already
// listens to then just picks them up, so this file never touches task
// state directly.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { BASE_URL, getToken } from "../api/client.js";
import { useAuth } from "./AuthContext.jsx";
import { useBoards } from "./BoardsContext.jsx";
import { applyRemoteTask, removeRemoteTask, syncNow } from "../db/tasksSync.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { boards } = useBoards();
  const [presenceByBoard, setPresenceByBoard] = useState({}); // boardId -> string[] of userIds

  const boardsRef = useRef(boards);
  useEffect(() => {
    boardsRef.current = boards;
  }, [boards]);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const token = getToken();
    if (!token) return undefined;

    // BASE_URL === "" means "same origin" (see api/client.js and
    // frontend/Dockerfile) — socket.io-client's way of expressing that is
    // omitting the url argument entirely, not passing "", so this can't
    // just be `io(BASE_URL, ...)`.
    const socket = io(BASE_URL || undefined, { auth: { token } });
    socketRef.current = socket;

    function handleRemoteTask(payload, apply) {
      // Our own change already landed locally via the optimistic PouchDB
      // write + the REST response that follows it — re-applying it here
      // would just be a no-op at best and a flicker at worst.
      if (payload.actorId === user?.id) return;
      apply(payload.task).catch((err) => console.error("Socket task sync failed:", err));
    }

    socket.on("connect", () => {
      boardsRef.current.forEach((b) => socket.emit("board:join", b.id));
      // Socket.IO reconnects for you, it does not replay what happened
      // while you were gone — a refetch is the cheap, correct recovery,
      // same as the offline-sync loop's own reconnect handling.
      syncNow().catch(() => {
        /* offline/unreachable — the background sync loop will retry */
      });
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection failed:", err.message);
      // Same signal the REST client already treats as "session's over" —
      // a token that's expired mid-session should log the user out, not
      // just silently fail to reconnect forever.
      if (err.message === "BAD_TOKEN" || err.message === "NO_TOKEN") {
        logout();
      }
    });

    socket.on("task:created", (payload) => handleRemoteTask(payload, applyRemoteTask));
    socket.on("task:updated", (payload) => handleRemoteTask(payload, applyRemoteTask));
    socket.on("task:deleted", ({ id, actorId }) => {
      if (actorId === user?.id) return;
      removeRemoteTask(id).catch((err) => console.error("Socket task delete sync failed:", err));
    });

    socket.on("presence:update", ({ boardId, users }) => {
      setPresenceByBoard((prev) => ({ ...prev, [boardId]: users }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // Reconnecting whenever the user changes (login/logout) is correct —
    // a stale socket authenticated as the previous user must not survive
    // a switch of accounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  // Join any newly-added board's room immediately rather than waiting for
  // the next reconnect (e.g. right after creating or accepting a board).
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;
    boards.forEach((b) => socket.emit("board:join", b.id));
  }, [boards]);

  return (
    <SocketContext.Provider value={{ presenceByBoard }}>{children}</SocketContext.Provider>
  );
}

// Online user ids for a given board (excluding nobody in particular —
// includes the current user too, same as the deck's presence design).
export function usePresence(boardId) {
  const ctx = useContext(SocketContext);
  return ctx?.presenceByBoard?.[boardId] ?? [];
}
