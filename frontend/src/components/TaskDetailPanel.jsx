import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { getColumns } from "../utils/columns";

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function TaskDetailPanel({ taskId, onClose, isOwner, currentUserId, members = [] }) {
  const tasks = useTasks();
  const { boards } = useBoards();
  const { updateTask, deleteTask, moveTask } = useTasksActions();
  const showToast = useToast();

  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const board = boards.find((b) => b.id === task.boardId);
  const columns = getColumns(board);

  // The assignee may move the card between columns; only the owner may
  // edit anything else (title, due date, who it's assigned to) or delete it.
  const isAssignee = task.assigneeId === currentUserId;
  const canMove = isOwner || isAssignee;
  const canEdit = isOwner;

  function handleDelete() {
    if (!canEdit) return;
    deleteTask(task.id);
    showToast(`Deleted "${task.title}"`, "success");
    onClose();
  }

  function handleColumnChange(newColumnId) {
    if (!canMove) return;
    moveTask(task.id, newColumnId);
  }

  function handleAssigneeChange(memberId) {
    if (!canEdit) return;
    const name = members.find((m) => m.id === memberId)?.name || "";
    updateTask(task.id, { assigneeId: memberId, assignee: name });
  }

  return (
    <>
      <div className="task-panel-backdrop" onClick={onClose} />
      <div className="task-panel">
        <div className="task-panel__header">
          <span className="task-panel__eyebrow">Task</span>
          <button className="task-panel__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <input
          className="task-panel__title"
          value={task.title}
          disabled={!canEdit}
          onChange={(e) => canEdit && updateTask(task.id, { title: e.target.value })}
        />

        <div className="task-panel__field">
          <span className="task-panel__label">Status</span>
          <div className="task-panel__status-group">
            {columns.map((c) => (
              <button
                key={c.id}
                disabled={!canMove}
                className={`task-panel__status-btn ${task.columnId === c.id ? "task-panel__status-btn--active" : ""}`}
                onClick={() => handleColumnChange(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
          {!canMove && <span className="task-panel__hint">Only the owner or assignee can move this card.</span>}
        </div>

        <div className="task-panel__field">
          <span className="task-panel__label">Assignee</span>
          {canEdit ? (
            <select
              className="task-panel__input"
              value={task.assigneeId || ""}
              onChange={(e) => handleAssigneeChange(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="task-panel__assignee">
              <div className="task-panel__avatar">{initials(task.assignee)}</div>
              {task.assignee}
            </div>
          )}
        </div>

        <div className="task-panel__field">
          <span className="task-panel__label">Due date</span>
          <input
            className="task-panel__input"
            value={task.dueDate}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { dueDate: e.target.value })}
          />
        </div>

        {canEdit && (
          <button className="task-panel__delete" onClick={handleDelete}>
            Delete task
          </button>
        )}
      </div>
    </>
  );
}

export default TaskDetailPanel;
