import { Link, useParams, useNavigate } from "react-router-dom";
import { useTasks, useTasksActions } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import mockTeam from "../data/mockTeam";

const STATUSES = ["To Do", "Doing", "Done"];

const STATUS_ACCENT = {
  "To Do": "var(--cb-violet)",
  Doing: "var(--cb-sky)",
  Done: "var(--cb-success)",
};

const ASSIGNEE_COLORS = {
  Sarah: "var(--cb-violet)",
  Jordan: "var(--cb-sky)",
  Priya: "var(--cb-success)",
};

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TaskDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const tasks = useTasks();
  const { updateTask, deleteTask, moveTask } = useTasksActions();
  const showToast = useToast();

  const task = tasks.find((t) => String(t.id) === id);

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

  function handleDelete() {
    deleteTask(task.id);
    showToast(`Deleted "${task.title}"`, "success");
    navigate("/my-tasks");
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
          <span className="task-detail__status-dot" style={{ background: STATUS_ACCENT[task.status] }} />
          <input
            className="task-detail__title"
            value={task.title}
            onChange={(e) => updateTask(task.id, { title: e.target.value })}
          />
          <span className="task-detail__id">#{task.id}</span>
        </div>

        <div className="task-detail__grid">
          <div className="task-detail__field">
            <span className="task-detail__label">Status</span>
            <div className="task-detail__status-group">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`task-detail__status-btn ${task.status === s ? "task-detail__status-btn--active" : ""}`}
                  onClick={() => moveTask(task.id, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Assignee</span>
            <div className="task-detail__assignee-group">
              {mockTeam.map((m) => (
                <button
                  key={m.id}
                  className={`task-detail__assignee-btn ${task.assignee === m.name ? "task-detail__assignee-btn--active" : ""}`}
                  onClick={() => updateTask(task.id, { assignee: m.name })}
                  title={m.name}
                >
                  <span
                    className="task-detail__assignee-avatar"
                    style={{ background: ASSIGNEE_COLORS[m.name] || "var(--cb-text-muted)" }}
                  >
                    {initials(m.name)}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="task-detail__field">
            <span className="task-detail__label">Due date</span>
            <input
              className="task-detail__input"
              value={task.dueDate}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value })}
            />
          </div>
        </div>

        <div className="task-detail__field">
          <span className="task-detail__label">Description</span>
          <textarea
            className="task-detail__textarea"
            placeholder="Add more detail about this task…"
            value={task.description || ""}
            onChange={(e) => updateTask(task.id, { description: e.target.value })}
          />
        </div>

        <button className="task-detail__delete" onClick={handleDelete}>
          Delete task
        </button>
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;