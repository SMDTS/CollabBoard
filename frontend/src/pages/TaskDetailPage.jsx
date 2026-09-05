
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchBoardMembers } from "../api/boards.js";
import { avatarColor } from "../utils/avatarColor";
import { getColumns } from "../utils/columns";

const STATUS_ACCENT = {
  "To Do": "var(--cb-violet)",
  Doing: "var(--cb-sky)",
  Done: "var(--cb-success)",
};

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const { boards } = useBoards();
  const { user } = useAuth();
  const { updateTask, deleteTask, moveTask } = useTasksActions();
  const showToast = useToast();
  const [members, setMembers] = useState([]);

  const task = tasks.find((t) => String(t.id) === id);
  const board = boards.find((b) => b.id === task?.boardId);

  useEffect(() => {
    if (!board) return;
    let cancelled = false;
    fetchBoardMembers(board.id)
      .then((m) => !cancelled && setMembers(m))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [board?.id]);

  if (!task) {
    return (
      <div className="page-shell">
        <p>No task found with id "{id}". It may have been deleted.</p>
        <Link to="/my-tasks" className="back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to My Tasks
        </Link>
      </div>
    );
  }

  const columns = getColumns(board);
  const currentColumn = columns.find((c) => c.id === task.columnId);

  // Only the board owner can edit or delete a task; the assigned member
  // can move it between columns and nothing else.
  const isOwner = !!board && board.ownerId === user?.id;
  const isAssignee = task.assigneeId === user?.id;
  const canMove = isOwner || isAssignee;
  const canEdit = isOwner;

  function handleDelete() {
    if (!canEdit) return;
    deleteTask(task.id);
    showToast(`Deleted "${task.title}"`, "success");
    navigate("/my-tasks");
  }

  function handleAssigneeChange(memberId) {
    if (!canEdit) return;
    const name = members.find((m) => m.id === memberId)?.name || "";
    updateTask(task.id, { assigneeId: memberId, assignee: name });
  }

  return (
    <div className="page-shell task-detail-page">
      <div className="task-detail-wrap">
        <Link to="/my-tasks" className="back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to My Tasks
        </Link>

        <div className="task-detail">
        <div className="task-detail__header">
          <span className="task-detail__status-dot" style={{ background: STATUS_ACCENT[currentColumn?.title] || "var(--cb-text-muted)" }} />
          <input
            className="task-detail__title"
            value={task.title}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { title: e.target.value })}
          />
          <span className="task-detail__id">#{task.id}</span>
        </div>

        <div className="task-detail__grid">
          <div className="task-detail__field">
            <span className="task-detail__label">Status</span>
            <div className="task-detail__status-group">
              {columns.map((c) => (
                <button
                  key={c.id}
                  disabled={!canMove}
                  className={`task-detail__status-btn ${task.columnId === c.id ? "task-detail__status-btn--active" : ""}`}
                  onClick={() => canMove && moveTask(task.id, c.id)}
                >
                  {c.title}
                </button>
              ))}
            </div>
            {!canMove && <span className="task-panel__hint">Only the owner or assignee can move this card.</span>}
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Assignee</span>
            {canEdit ? (
              <div className="task-detail__assignee-group">
                {members.map((m) => (
                  <button
                    key={m.id}
                    className={`task-detail__assignee-btn ${task.assigneeId === m.id ? "task-detail__assignee-btn--active" : ""}`}
                    onClick={() => handleAssigneeChange(m.id)}
                    title={m.name}
                  >
                    <span className="task-detail__assignee-avatar" style={{ background: avatarColor(m.name) }}>
                      {initials(m.name)}
                    </span>
                    {m.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="task-detail__assignee-group">
                <span className="task-detail__assignee-btn task-detail__assignee-btn--active">
                  <span className="task-detail__assignee-avatar" style={{ background: avatarColor(task.assignee) }}>
                    {initials(task.assignee)}
                  </span>
                  {task.assignee}
                </span>
              </div>
            )}
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Due date</span>
            <input
              className="task-detail__input"
              value={task.dueDate}
              disabled={!canEdit}
              onChange={(e) => canEdit && updateTask(task.id, { dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="task-detail__field">
          <span className="task-detail__label">Description</span>
          <textarea
            className="task-detail__textarea"
            placeholder="Add more detail about this task…"
            value={task.description || ""}
            disabled={!canEdit}
            onChange={(e) => canEdit && updateTask(task.id, { description: e.target.value })}
          />
        </div>

        {canEdit && (
          <button className="task-detail__delete" onClick={handleDelete}>
            Delete task
          </button>
        )}
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;
