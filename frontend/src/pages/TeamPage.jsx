// TeamPage.jsx
import { useState, useEffect } from "react";
import { useUsers } from "../context/UsersContext";
import { useBoards } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { fetchBoardStats } from "../api/boards.js";


const ACCENTS = ["team-accent--violet", "team-accent--sky", "team-accent--green"];

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  const [query, setQuery] = useState("");
  const showToast = useToast();
  const { users, isLoading, error } = useUsers();
  const { boards, isLoading: boardsLoading } = useBoards();

  // Per-assignee stats, merged across every board. The actual grouping
  // and overdue check happens in MongoDB's aggregation pipeline
  // (GET /api/boards/:id/stats) — this just sums each board's numbers
  // together per assignee instead of filtering the raw task list here.
  const [statsByAssignee, setStatsByAssignee] = useState({});
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (boardsLoading) return;
    if (boards.length === 0) {
      setStatsByAssignee({});
      setStatsLoading(false);
      return;
    }

    let cancelled = false;
    setStatsLoading(true);

    Promise.all(boards.map((b) => fetchBoardStats(b.id).catch(() => [])))
      .then((allBoardStats) => {
        if (cancelled) return;
        const merged = {};
        for (const boardStats of allBoardStats) {
          for (const { assignee, taskCount, overdueCount } of boardStats) {
            if (!merged[assignee]) merged[assignee] = { taskCount: 0, overdueCount: 0 };
            merged[assignee].taskCount += taskCount;
            merged[assignee].overdueCount += overdueCount;
          }
        }
        setStatsByAssignee(merged);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [boards, boardsLoading]);

  const filtered = users.filter((u) => u.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="page-shell">
      <div className="team-page__header">
        <div>
          <h1 className="page-shell__title">Team</h1>
          <p className="page-shell__subtitle" style={{ marginBottom: 0 }}>
            {users.length} {users.length === 1 ? "member" : "members"} with access to your boards.
          </p>
        </div>
        <input
          type="text"
          className="team-search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && <p className="page-shell__subtitle">Loading team…</p>}
      {error && <p className="ft-error" style={{ maxWidth: 320 }}>Couldn't load team: {error}</p>}

      {!isLoading && !error && (
        <div className="team-grid">
          {filtered.map((member, i) => {
            const stats = statsByAssignee[member.name] ?? { taskCount: 0, overdueCount: 0 };
            const { taskCount, overdueCount } = stats;
            const onTrackPct = taskCount ? Math.round(((taskCount - overdueCount) / taskCount) * 100) : 100;

            return (
              <div className={`team-card ${ACCENTS[i % ACCENTS.length]}`} key={member.id}>
                <div className="team-card__avatar-wrap">
                  <div className="team-card__avatar">{initials(member.name)}</div>
                </div>
                <div className="team-card__info">
                  <h2 className="team-card__name">{member.name}</h2>
                  <p className="team-card__email">{member.email}</p>
                </div>

                <div className="team-card__progress">
                  <div className="team-card__progress-track">
                    <div className="team-card__progress-fill" style={{ width: `${onTrackPct}%` }} />
                  </div>
                  <span className="team-card__progress-label">
                    {statsLoading ? "Loading…" : `${onTrackPct}% on track`}
                  </span>
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

          {/* TODO: a real "invite" flow needs an email service + invite
              tokens. Right now, people join by registering themselves. */}
          <button
            type="button"
            className="team-card team-card--invite"
            onClick={() => showToast("For now, teammates join by signing up themselves at /signup")}
          >
            <span className="team-card__invite-icon">+</span>
            Invite member
          </button>
        </div>
      )}
    </div>
  );
}

export default TeamPage;