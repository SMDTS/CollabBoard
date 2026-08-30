// TeamPage.jsx
import { useState } from "react";
import mockTeam from "../data/mockTeam";
import { useTasks } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";

const ACCENTS = ["team-accent--violet", "team-accent--sky", "team-accent--green"];

const STATUS_LABEL = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  const [query, setQuery] = useState("");
  const showToast = useToast();
  const mockTasks = useTasks();

  const filtered = mockTeam.filter(
    (m) => m.name.toLowerCase().includes(query.toLowerCase()) || m.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-shell">
      <div className="team-page__header">
        <div>
          <h1 className="page-shell__title">Team</h1>
          <p className="page-shell__subtitle" style={{ marginBottom: 0 }}>
            {mockTeam.length} members with access to your boards.
          </p>
        </div>
        <input
          type="text"
          className="team-search"
          placeholder="Search by name or role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="team-grid">
        {filtered.map((member, i) => {
          const memberTasks = mockTasks.filter((t) => t.assignee === member.name);
          const taskCount = memberTasks.length;
          const doneCount = memberTasks.filter((t) => t.status === "Done").length;
          const pct = taskCount ? Math.round((doneCount / taskCount) * 100) : 0;

          return (
            <div className={`team-card ${ACCENTS[i % ACCENTS.length]}`} key={member.id}>
              <div className="team-card__avatar-wrap">
                <div className="team-card__avatar">{initials(member.name)}</div>
                <span className={`team-card__status-dot team-card__status-dot--${member.status}`} title={STATUS_LABEL[member.status]} />
              </div>
              <div className="team-card__info">
                <h2 className="team-card__name">{member.name}</h2>
                <p className="team-card__role">{member.role}</p>
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
