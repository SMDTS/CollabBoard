// TeamPage.jsx
import { useState } from "react";
import mockTeam from "../data/mockTeam";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";

// Real registered users only have { id, name, email } — no role or online
// status, since nothing in registration ever collects those. Cycling
// through the same 3 accent colors as before, just as decoration now
// rather than tied to a real "role" field.
const ACCENTS = ["team-accent--violet", "team-accent--sky", "team-accent--green"];

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  const [query, setQuery] = useState("");
  const showToast = useToast();
  const mockTasks = useTasks();

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
            const memberTasks = tasks.filter((t) => t.assignee === member.name);
            const taskCount = memberTasks.length;
            const doneCount = memberTasks.filter((t) => t.status === "Done").length;
            const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

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
                    <div className="team-card__progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="team-card__progress-label">{pct}% complete</span>
                </div>

                <div className="team-card__stats">
                  <span className="team-card__stat">
                    <strong>{taskCount}</strong> tasks
                  </span>
                  <span className="team-card__stat">
                    <strong>{doneCount}</strong> done
                  </span>
                </div>
              </div>
            );
          })}

        {/* TODO (M2 owner): wire this up to a real invite flow once auth exists. */}
        <button
          type="button"
          className="team-card team-card--invite"
          onClick={() => showToast("Invites need real auth (M2) — coming soon")}
        >
          <span className="team-card__invite-icon">+</span>
          Invite member
        </button>
      </div>
    </div>
  );
}

export default TeamPage;
