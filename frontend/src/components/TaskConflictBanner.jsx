import { useTaskConflicts, useTasksActions } from "../context/TasksContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";
import { columnTitle } from "../utils/columns.js";

const FIELDS = ["title", "assignee"];

export function TaskConflictBanner() {
  const conflicts = useTaskConflicts();
  const { resolveConflict } = useTasksActions();
  const { boards } = useBoards();

  if (!conflicts.length) return null;

  return (
    <div className="conflict-stack" role="alert">
      {conflicts.map(({ taskId, localTask, serverTask }) => {
        const board = boards.find((b) => b.id === localTask.boardId);
        // Column ids aren't meaningful to a person — show the column's
        // title on each side instead of the raw id.
        const localWithColumn = { ...localTask, column: columnTitle(board, localTask.columnId) };
        const serverWithColumn = { ...serverTask, column: columnTitle(board, serverTask.columnId) };

        return (
          <div className="conflict-card" key={taskId}>
            <p className="conflict-card__title">
              "{localTask.title}" changed on another device while you were editing it.
            </p>

            <div className="conflict-card__versions">
              <VersionColumn label="Your version" task={localWithColumn} other={serverWithColumn} />
              <VersionColumn label="Latest version" task={serverWithColumn} other={localWithColumn} />
            </div>

            <div className="conflict-card__actions">
              <button onClick={() => resolveConflict(taskId, "keepLocal")}>Keep mine</button>
              <button onClick={() => resolveConflict(taskId, "keepServer")}>
                Use latest
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VersionColumn({ label, task, other }) {
  return (
    <div className="conflict-card__version">
      <h4>{label}</h4>
      <dl>
        {[...FIELDS, "column"].map((field) => (
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
