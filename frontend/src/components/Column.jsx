// Column.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useTasksActions } from "../context/TasksContext";

const STATUS_THEME = {
  "To Do": { accent: "#8b6ff2", tint: "rgba(139, 111, 242, 0.08)" },
  Doing: { accent: "#38bdf8", tint: "rgba(56, 189, 248, 0.08)" },
  Done: { accent: "#10b981", tint: "rgba(16, 185, 129, 0.08)" },
};

const COLUMN_VARIANTS = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1],
      staggerChildren: 0.07,
    },
  },
};

function Column({ title, children, columnId, isOwner, onAddTask }) {
  const { moveTask } = useTasksActions();
  const [isDragOver, setIsDragOver] = useState(false);

  const theme = STATUS_THEME[title] || { accent: "#8b6ff2", tint: "rgba(255, 255, 255, 0.03)" };
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

    const taskId = e.dataTransfer.getData("text/task-id");
    if (taskId) moveTask(taskId, columnId);
  }

  return (
    <motion.div
      variants={COLUMN_VARIANTS}
      className={`board-column ${isDragOver ? "board-column--drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="board-column__header">
        <span className="board-column__dot" style={{ background: theme.accent }} />
        <h2 className="board-column__title">{title}</h2>
        <span className="board-column__count">{children.length}</span>
      </div>
      <motion.div className="board-column__cards">
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

        {/* Only the board owner creates and assigns tasks — everyone else
            just moves the cards already assigned to them. Opens the
            create-task modal (see Board.jsx) pre-set to this column. */}
        {isOwner && (
          <button className="board-column__add-btn" onClick={onAddTask}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add a card
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Column;
