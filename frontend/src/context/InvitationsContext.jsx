// InvitationsContext.jsx
// Powers the notification bell: pending board invites addressed to the
// current user. Polls lightly (same pattern as TasksContext's background
// sync loop) rather than pushing, since this app has no websocket layer.
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as invitationsApi from "../api/invitations.js";
import { useBoardsActions } from "./BoardsContext.jsx";

const POLL_MS = 20000;

const InvitationsStateContext = createContext(null);
const InvitationsActionsContext = createContext(null);

export function InvitationsProvider({ children }) {
  const [invitations, setInvitations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const boardsActions = useBoardsActions();
  const intervalRef = useRef(null);

  const reload = useCallback(() => {
    return invitationsApi
      .fetchMyInvitations()
      .then(setInvitations)
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

  const respond = async (id, action) => {
    await invitationsApi.respondToInvitation(id, action);
    setInvitations((prev) => prev.filter((inv) => inv.id !== id));
    // Accepting adds a new board to this user's list — refresh so it
    // shows up on the Boards page / board switcher right away.
    if (action === "accept") boardsActions?.reload();
  };

  return (
    <InvitationsStateContext.Provider value={{ invitations, isLoading }}>
      <InvitationsActionsContext.Provider value={{ respond, reload }}>
        {children}
      </InvitationsActionsContext.Provider>
    </InvitationsStateContext.Provider>
  );
}

export function useInvitations() {
  return useContext(InvitationsStateContext);
}

export function useInvitationsActions() {
  return useContext(InvitationsActionsContext);
}
