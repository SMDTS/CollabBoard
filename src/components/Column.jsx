// Column.jsx
import { useState } from "react";
import { useTasksActions } from "../context/TasksContext";

const STATUS_THEME = {
  "To Do": { accent: "var(--cb-violet)", tint: "var(--cb-todo-tint)" },
  Doing: { accent: "var(--cb-sky)", tint: "var(--cb-doing-tint)" },
  Done: { accent: "var(--cb-success)", tint: "var(--cb-done-tint)" },
};

function Column({ title, children, onOpenTask }) {
  const { moveTask } = useTasksActions();
  const [isDragOver, setIsDragOver] = useState(false);
  const theme = STATUS_THEME[title] || { accent: "var(--cb-violet)", tint: "var(--cb-surface-sunken)" };
  const isEmpty = children.length === 0;

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = Number(e.dataTransfer.getData("text/task-id"));
    if (taskId) moveTask(taskId, title);
  }

  return (
    <div
      className={`board-column ${isDragOver ? "board-column--drag-over" : ""}`}
      style={{ background: theme.tint, borderColor: theme.accent }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="board-column__header">
        <span className="board-column__dot" style={{ background: theme.accent }} />
        <h2 className="board-column__title">{title}</h2>
        <span className="board-column__count">{children.length}</span>
      </div>
      <div className="board-column__cards">
        {isEmpty ? (
          <div className="board-column__empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="13" y2="14" />
            </svg>
            <span>No tasks yet</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default Column;