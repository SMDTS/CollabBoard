import { useTaskConflicts, useTasksActions } from "../context/TasksContext.jsx";

const FIELDS = ["title", "status", "assignee"];

export function TaskConflictBanner() {
  const conflicts = useTaskConflicts();
  const { resolveConflict } = useTasksActions();

  if (!conflicts.length) return null;

  return (
    <div className="conflict-stack" role="alert">
      {conflicts.map(({ taskId, localTask, serverTask }) => (
        <div className="conflict-card" key={taskId}>
          <p className="conflict-card__title">
            "{localTask.title}" changed on another device while you were editing it.
          </p>

          <div className="conflict-card__versions">
            <VersionColumn label="Your version" task={localTask} other={serverTask} />
            <VersionColumn label="Latest version" task={serverTask} other={localTask} />
          </div>

          <div className="conflict-card__actions">
            <button onClick={() => resolveConflict(taskId, "keepLocal")}>Keep mine</button>
            <button onClick={() => resolveConflict(taskId, "keepServer")}>
              Use latest
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function VersionColumn({ label, task, other }) {
  return (
    <div className="conflict-card__version">
      <h4>{label}</h4>
      <dl>
        {FIELDS.map((field) => (
          <div
            className={task[field] !== other[field] ? "conflict-card__field--diff" : undefined}
            key={field}
          >
            <dt>{field}</dt>
            <dd>{String(task[field] ?? "—")}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
