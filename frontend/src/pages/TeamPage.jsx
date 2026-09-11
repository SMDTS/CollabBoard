// TeamPage.jsx
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { searchUsers } from "../api/users.js";
import { AUTH_BG } from "../assets/cdn.js";
import {
  fetchBoardStats,
  fetchBoardMembers,
  fetchBoardInvitations,
  inviteBoardMember,
  kickBoardMember,
} from "../api/boards.js";
import UserAvatar from "../components/UserAvatar.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

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

  async function handleInvite(email, targetUserId) {
    if (!boardId) return;
    setInvitingId(targetUserId);
    try {
      await inviteBoardMember(boardId, email);
      showToast(`Invited ${email}`, "success");
      const updated = await fetchBoardInvitations(boardId);
      setInvitations(updated);
    } catch (err) {
      showToast(err.message || "Couldn't invite user", "error");
    } finally {
      setInvitingId(null);
    }
  }

  const [memberToKick, setMemberToKick] = useState(null);
  const [isKicking, setIsKicking] = useState(false);

  function handlePromptKick(memberId, memberName) {
    if (!boardId || !isOwner) return;
    setMemberToKick({ id: memberId, name: memberName });
  }

  async function executeKick() {
    if (!memberToKick || !boardId || !isOwner) return;
    setIsKicking(true);
    try {
      await kickBoardMember(boardId, memberToKick.id);
      showToast(`Removed ${memberToKick.name}`, "success");
      setMembers((prev) => prev.filter((m) => m.id !== memberToKick.id));
      setMemberToKick(null);
    } catch (err) {
      showToast(err.message || "Couldn't remove member", "error");
    } finally {
      setIsKicking(false);
    }
  }

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase())
  );

  const memberIds = new Set(members.map((m) => m.id));
  const invitableResults = searchResults.filter((u) => !memberIds.has(u.id));

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
        className="bp2-frame"
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="team-page__header">
          <div className="team-page__titles">
            <h1 className="bp2-title" style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>Team Directory</h1>
            <p className="bp2-subtitle" style={{ marginBottom: 0 }}>
              {board
                ? `${members.length} ${members.length === 1 ? "member" : "members"} on "${board.name}".`
                : "Select a board to manage team members."}
            </p>
          </div>

          <div className="team-controls">
            {/* Board Selector */}
            <div className="team-control-group">
              <span className="team-control-label">Board</span>
              <div className="team-select-box">
                <svg className="team-control-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18" />
                  <path d="M14 9h7" />
                  <path d="M14 15h7" />
                </svg>
                <select
                  className="team-select-input"
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
                <svg className="team-select-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            {/* Member Search */}
            <div className="team-control-group">
              <span className="team-control-label">Filter & Invite</span>
              <div className="team-search-box">
                <svg className="team-control-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="team-search-input"
                  placeholder="Search name or email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button type="button" className="team-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
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
            {filteredMembers.map((member) => {
              const memberStats = stats[member.id] ?? { taskCount: 0, overdueCount: 0 };
              const { taskCount, overdueCount } = memberStats;
              const onTrackPct = taskCount ? Math.round(((taskCount - overdueCount) / taskCount) * 100) : 100;

              return (
                <div className="team-card" key={member.id}>
                  {/* Top Ambient Glow */}
                  <div className="team-card__glow" aria-hidden="true" />

                  {isOwner && member.role !== "owner" && (
                    <button
                      type="button"
                      className="team-card__kick"
                      onClick={() => handlePromptKick(member.id, member.name)}
                      title={`Remove ${member.name}`}
                    >
                      ×
                    </button>
                  )}

                  {/* Avatar */}
                  <div className="team-card__avatar-wrap">
                    <UserAvatar user={member} size={64} className="team-card__avatar-img" />
                    <span className="team-card__status-dot" aria-hidden="true" />
                  </div>

                  {/* User Info */}
                  <div className="team-card__info">
                    <div className="team-card__name-row">
                      <h3 className="team-card__name">{member.name}</h3>
                      <span className="team-card__role-badge">
                        {member.role === "owner" ? "Owner" : "Member"}
                      </span>
                    </div>
                    <p className="team-card__email">{member.email}</p>
                  </div>

                  {/* Progress Bar Section */}
                  <div className="team-card__progress-sec">
                    <div className="team-card__progress-track">
                      <div
                        className="team-card__progress-fill"
                        style={{ width: `${onTrackPct}%` }}
                      />
                    </div>
                    <p className="team-card__progress-subtext">
                      <span className="team-card__progress-highlight">{onTrackPct}%</span> on track
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="team-card__divider" />

                  {/* Task Statistics */}
                  <div className="team-card__stats-grid">
                    <div className="team-card__stat-col">
                      <span className="team-card__stat-val">{taskCount}</span>
                      <span className="team-card__stat-lbl">tasks</span>
                    </div>
                    <div className="team-card__stat-col">
                      <span
                        className={`team-card__stat-val ${
                          overdueCount > 0 ? "team-card__stat-val--rose" : ""
                        }`}
                      >
                        {overdueCount}
                      </span>
                      <span className="team-card__stat-lbl">overdue</span>
                    </div>
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
                      <UserAvatar user={u} size={32} />
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
      </motion.div>

      <ConfirmModal
        isOpen={!!memberToKick}
        onClose={() => setMemberToKick(null)}
        onConfirm={executeKick}
        title="Remove Team Member"
        message={memberToKick ? `Are you sure you want to remove ${memberToKick.name} from "${board?.name || "this board"}"?` : ""}
        confirmText="Remove Member"
        danger={true}
        isLoading={isKicking}
      />
    </motion.div>
  );
}

export default TeamPage;
