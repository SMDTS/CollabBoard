// TeamPage.jsx
import mockTeam from "../data/mockTeam";
import mockTasks from "../data/mockTasks";

const ACCENTS = ["team-accent--violet", "team-accent--sky", "team-accent--green"];

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TeamPage() {
  return (
    <div className="team-page">
      <h1 className="team-page__title">Team</h1>
      <p className="team-page__subtitle">
        Everyone with access to your boards. Invite/remove members comes with real auth at M2.
      </p>

      <div className="team-grid">
        {mockTeam.map((member, i) => {
          const taskCount = mockTasks.filter((t) => t.assignee === member.name).length;
          const doneCount = mockTasks.filter((t) => t.assignee === member.name && t.status === "Done").length;

          return (
            <div className={`team-card ${ACCENTS[i % ACCENTS.length]}`} key={member.id}>
              <div className="team-card__avatar">{initials(member.name)}</div>
              <div className="team-card__info">
                <h2 className="team-card__name">{member.name}</h2>
                <p className="team-card__role">{member.role}</p>
                <p className="team-card__email">{member.email}</p>
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
      </div>
    </div>
  );
}

export default TeamPage;