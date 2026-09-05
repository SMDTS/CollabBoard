// TeamPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { searchUsers } from "../api/users.js";
import {
  fetchBoardStats,
  fetchBoardMembers,
  fetchBoardInvitations,
  inviteBoardMember,
  kickBoardMember,
} from "../api/boards.js";

const ACCENTS = ["team-accent--violet", "team-accent--sky", "team-accent--green"];
const SEARCH_DEBOUNCE_MS = 300;

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function TeamPage() {
  const [query, setQuery] = useState("");
  const showToast = useToast();
  const { user } = useAuth();
  const { boards, isLoading: boardsLoading } = useBoards();

  // The team is scoped to one board at a time: pick a board first, then
  // see (and, if you own it, manage) who has access to it.
  const [boardId, setBoardId] = useState("");
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [stats, setStats] = useState({});

  // Pending invites this board's owner has already sent, keyed by the
  // invited person's user id — so a search hit can show "Invited"
  // instead of offering to invite them again.
  const [pendingInvites, setPendingInvites] = useState({});
  const [invitingId, setInvitingId] = useState(null);

  // Search-as-you-type results from the whole user directory (name or
  // email), for the "not a member yet? invite them" flow.
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (boardsLoading || boardId || boards.length === 0) return;
    setBoardId(boards[0].id);
  }, [boardsLoading, boards, boardId]);

  const board = boards.find((b) => b.id === boardId);
  const isOwner = !!board && board.ownerId === user?.id;

  const loadMembers = useCallback(() => {
    if (!boardId) return;
    setMembersLoading(true);
    setMembersError(null);
    return fetchBoardMembers(boardId)
      .then(setMembers)
      .catch((err) => setMembersError(err.message))
      .finally(() => setMembersLoading(false));
  }, [boardId]);

  const loadPendingInvites = useCallback(() => {
    if (!boardId || !isOwner) {
      setPendingInvites({});
      return;
    }
    fetchBoardInvitations(boardId)
      .then((invites) => {
        const byUserId = {};
        for (const inv of invites) byUserId[inv.invitedUserId] = inv;
        setPendingInvites(byUserId);
      })
      .catch(() => setPendingInvites({}));
  }, [boardId, isOwner]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadPendingInvites();
  }, [loadPendingInvites]);

  useEffect(() => {
    if (!boardId) return;
    fetchBoardStats(boardId)
      .then((rows) => {
        const byId = {};
        for (const row of rows) byId[row.assigneeId] = row;
        setStats(byId);
      })
      .catch(() => setStats({}));
  }, [boardId]);

  // Search the whole user directory by name/email while typing, so the
  // owner can find and invite someone who isn't a member yet.
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOwner || trimmed.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearchLoading(true);
    const timer = setTimeout(() => {
      searchUsers(trimmed)
        .then((results) => {
          if (!cancelled) setSearchResults(results);
        })
        .catch(() => {
          if (!cancelled) setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearchLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOwner]);

  async function handleInvite(email, userId) {
    setInvitingId(userId);
    try {
      await inviteBoardMember(boardId, email);
      showToast(`Invite sent to ${email}`, "success");
      loadPendingInvites();
    } catch (err) {
      showToast(err.message || "Couldn't send that invite", "error");
    } finally {
      setInvitingId(null);
    }
  }

  async function handleKick(memberId, memberName) {
    if (!window.confirm(`Remove ${memberName} from this board?`)) return;
    try {
      const updated = await kickBoardMember(boardId, memberId);
      setMembers(updated);
      showToast(`Removed ${memberName}`, "success");
    } catch (err) {
      showToast(err.message || "Couldn't remove that member", "error");
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  // Someone the search turned up who isn't already on this board — that's
  // who gets an "Invite" button. Already-invited people show as pending.
  const memberIds = new Set(members.map((m) => m.id));
  const invitableResults = searchResults.filter((u) => !memberIds.has(u.id));

  return (
    <div className="page-shell">
      <div className="team-page__header">
        <div>
          <h1 className="page-shell__title">Team</h1>
          <p className="page-shell__subtitle" style={{ marginBottom: 0 }}>
            {board
              ? `${members.length} ${members.length === 1 ? "member" : "members"} on "${board.name}".`
              : "Pick a board to see its members."}
          </p>
        </div>

        <select
          className="team-search"
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          disabled={boardsLoading || boards.length === 0}
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          className="team-search"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {boardsLoading && <p className="page-shell__subtitle">Loading boards…</p>}
      {!boardsLoading && boards.length === 0 && (
        <p className="page-shell__subtitle">You don't own or belong to any boards yet.</p>
      )}

      {membersLoading && <p className="page-shell__subtitle">Loading team…</p>}
      {membersError && <p className="ft-error" style={{ maxWidth: 320 }}>Couldn't load team: {membersError}</p>}

      {!membersLoading && !membersError && board && (
        <>
          <div className="team-grid">
            {filteredMembers.map((member, i) => {
              const memberStats = stats[member.id] ?? { taskCount: 0, overdueCount: 0 };
              const { taskCount, overdueCount } = memberStats;
              const onTrackPct = taskCount ? Math.round(((taskCount - overdueCount) / taskCount) * 100) : 100;

              return (
                <div className={`team-card ${ACCENTS[i % ACCENTS.length]}`} key={member.id}>
                  {isOwner && member.role !== "owner" && (
                    <button
                      type="button"
                      className="team-card__kick"
                      onClick={() => handleKick(member.id, member.name)}
                      title={`Remove ${member.name}`}
                    >
                      ×
                    </button>
                  )}
                  <div className="team-card__avatar-wrap">
                    <div className="team-card__avatar">{initials(member.name)}</div>
                  </div>
                  <div className="team-card__info">
                    <h2 className="team-card__name">
                      {member.name} {member.role === "owner" && <span className="team-card__owner-badge">Owner</span>}
                    </h2>
                    <p className="team-card__email">{member.email}</p>
                  </div>

                  <div className="team-card__progress">
                    <div className="team-card__progress-track">
                      <div className="team-card__progress-fill" style={{ width: `${onTrackPct}%` }} />
                    </div>
                    <span className="team-card__progress-label">{`${onTrackPct}% on track`}</span>
                  </div>

                  <div className="team-card__stats">
                    <span className="team-card__stat">
                      <strong>{taskCount}</strong> tasks
                    </span>
                    <span className="team-card__stat">
                      <strong>{overdueCount}</strong> overdue
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Only the owner can search the wider directory and invite —
              matches show up here, separate from the existing-members grid
              above, since these people aren't on the board yet. */}
          {isOwner && query.trim().length >= 2 && (
            <div className="team-invite-results">
              <h3 className="team-invite-results__title">Invite to this board</h3>
              {searchLoading && <p className="page-shell__subtitle">Searching…</p>}
              {!searchLoading && invitableResults.length === 0 && (
                <p className="page-shell__subtitle">No matching users to invite.</p>
              )}
              {!searchLoading &&
                invitableResults.map((u) => {
                  const pending = pendingInvites[u.id];
                  return (
                    <div className="team-invite-row" key={u.id}>
                      <div className="team-invite-row__avatar">{initials(u.name)}</div>
                      <div className="team-invite-row__info">
                        <span className="team-invite-row__name">{u.name}</span>
                        <span className="team-invite-row__email">{u.email}</span>
                      </div>
                      <button
                        type="button"
                        className="team-invite-row__btn"
                        disabled={!!pending || invitingId === u.id}
                        onClick={() => handleInvite(u.email, u.id)}
                      >
                        {pending ? "Invited" : invitingId === u.id ? "Inviting…" : "Invite"}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TeamPage;
