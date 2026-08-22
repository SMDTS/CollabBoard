const ASSIGNEE_COLORS = {
  Sarah: "var(--cb-violet)",
  Jordan: "var(--cb-sky)",
  Priya: "var(--cb-success)",
};

const STATUS_ACCENT = {
  "To Do": "var(--cb-violet)",
  Doing: "var(--cb-sky)",
  Done: "var(--cb-success)",
};

function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

function TaskCard({ id, title, assignee, dueDate, status, onOpen }) {
  const avatarColor = ASSIGNEE_COLORS[assignee] || "var(--cb-text-muted)";
  const accent = STATUS_ACCENT[status] || "var(--cb-text-muted)";

  function handleDragStart(e) {
    e.dataTransfer.setData("text/task-id", String(id));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <div
      className="board-card"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onOpen?.(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.(id)}
    >
      <h3 className="board-card__title">{title}</h3>
      <div className="board-card__footer">
        <div className="board-card__left">
          <span className="board-card__status-dot" style={{ background: accent }} />
          <div className="board-card__assignee" style={{ background: avatarColor }} title={assignee}>
            {initials(assignee)}
          </div>
        </div>
        <span className="board-card__due">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {dueDate}
        </span>
      </div>
    </div>
  );
}

export default TaskCard;