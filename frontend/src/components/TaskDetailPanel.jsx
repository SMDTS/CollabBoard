import { motion } from "framer-motion";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { getColumns } from "../utils/columns";
import UserAvatar from "./UserAvatar.jsx";

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
      <motion.div
        className="bp2-panel-backdrop"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      />
      {/* Shares a layoutId with the TaskCard that was clicked to open this
          panel — Framer Motion morphs the small card into this full-height
          drawer instead of just popping it in from nowhere. */}
      <motion.div
        layoutId={`task-card-${task.id}`}
        className="bp2-panel"
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
      >
        <div className="bp2-panel__header">
          <span className="bp2-panel__eyebrow">Task</span>
          <button className="bp2-panel__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <input
          className="bp2-panel__title"
          value={task.title}
          disabled={!canEdit}
          onChange={(e) => canEdit && updateTask(task.id, { title: e.target.value })}
        />

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Status</span>
          <div className="bp2-panel__status-group">
            {columns.map((c) => (
              <button
                key={c.id}
                disabled={!canMove}
                className={`bp2-panel__status-btn ${task.columnId === c.id ? "bp2-panel__status-btn--active" : ""}`}
                onClick={() => handleColumnChange(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>
          {!canMove && <span className="bp2-panel__hint">Only the owner or assignee can move this card.</span>}
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Assignee</span>
          {canEdit ? (
            <select
              className="bp2-panel__input"
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
            <div className="bp2-panel__assignee">
              <UserAvatar user={members.find((m) => m.id === task.assigneeId || m.name === task.assignee)} name={task.assignee} size={26} className="bp2-panel__avatar" />
              {task.assignee}
            </div>
          )}
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Due date</span>
          <input
            className="bp2-panel__input"
            value={task.dueDate}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { dueDate: e.target.value })}
          />
        </div>

        <div className="bp2-panel__field">
          <span className="bp2-panel__label">Description</span>
          <textarea
            className="bp2-panel__textarea"
            placeholder="Add more detail about this task…"
            value={task.description || ""}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { description: e.target.value })}
            rows={4}
          />
        </div>

        {canEdit && (
          <button className="bp2-panel__delete" onClick={handleDelete}>
            Delete task
          </button>
        )}
      </motion.div>
    </>
  );
}

export default TaskDetailPanel;