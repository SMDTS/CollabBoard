import { motion } from "framer-motion";
import UserAvatar from "./UserAvatar.jsx";

const STATUS_ACCENT = {
  "To Do": "#8b6ff2",
  Doing: "#38bdf8",
  Done: "#10b981",
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

function TaskCard({ id, title, assignee, assigneeId, members, dueDate, columnTitle, onOpen, canDrag = true }) {
  const accent = STATUS_ACCENT[columnTitle] || "#8b6ff2";
  const member = members?.find((m) => m.id === assigneeId || m.name === assignee);

  function handleDragStart(e) {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/task-id", String(id));
    e.dataTransfer.effectAllowed = "move";
  }

  return (
    <motion.div
      className={`bp2-card ${!canDrag ? "bp2-card--locked" : ""}`}
      layoutId={`task-card-${id}`}
      variants={ITEM_VARIANTS}
      whileHover={canDrag ? { y: -3, scale: 1.015, boxShadow: "0 8px 24px rgba(139, 111, 242, 0.25)", borderColor: "rgba(139, 111, 242, 0.6)" } : undefined}
      whileTap={canDrag ? { scale: 0.97 } : undefined}
      draggable={canDrag}
      onDragStart={handleDragStart}
      onClick={() => onOpen?.(id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.(id)}
      title={canDrag ? undefined : "Only the board owner or the assigned member can move this card"}
    >
      <h3 className="bp2-card__title">{title}</h3>
      <div className="bp2-card__footer">
        <div className="bp2-card__left">
          <span className="bp2-card__status-dot" style={{ background: accent }} />
          <UserAvatar user={member} name={assignee} size={22} className="bp2-card__assignee" />
        </div>
        <span className="bp2-card__due">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {dueDate}
        </span>
      </div>
    </motion.div>
  );
}

export default TaskCard;