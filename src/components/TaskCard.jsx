// TaskCard.jsx
function TaskCard({ title, assignee, dueDate, status }) {
  return (
    <div className="board-card">
      <h3 className="board-card__title">{title}</h3>
      <div className="board-card__meta">
        <span className="board-card__assignee">{assignee}</span>
        <span className="board-card__due">{dueDate}</span>
      </div>
      <span className={`board-card__status board-card__status--${status.toLowerCase().replace(" ", "-")}`}>
        {status}
      </span>
    </div>
  );
}

export default TaskCard;
