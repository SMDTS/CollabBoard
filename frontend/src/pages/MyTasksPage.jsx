// MyTasksPage.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTasks } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { columnTitle } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";

const MotionLink = motion.create(Link);

const STATUS_ACCENTS = {
  "To Do": "#8b6ff2",
  Doing: "#f59e0b",
  Done: "#10b981",
};

function MyTasksPage() {
  const tasks = useTasks();
  const { boards } = useBoards();
  const { user } = useAuth();
  
  // Tasks assigned to current user
  const myTasks = tasks.filter((task) => task.assigneeId === user?.id);

  const grouped = new Map();
  for (const task of myTasks) {
    const board = boards.find((b) => b.id === task.boardId);
    const title = columnTitle(board, task.columnId);
    if (!grouped.has(title)) grouped.set(title, []);
    grouped.get(title).push(task);
  }

  return (
    <motion.div
      className="page-shell bp2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      <motion.div
        className="bp2-frame"
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="mytasks-header">
          <div>
            <h1 className="bp2-title" style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>My Tasks</h1>
            <p className="bp2-subtitle" style={{ marginBottom: 0 }}>
              Tasks assigned to <strong>{user?.name}</strong> across all boards.
            </p>
          </div>

          <div className="mytasks-stats-bar">
            <div className="mytasks-stat-pill">
              <span className="mytasks-stat-pill__num">{myTasks.length}</span>
              <span className="mytasks-stat-pill__lbl">Total Assigned</span>
            </div>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="mytasks-empty-box">
            <div className="mytasks-empty-icon">✓</div>
            <h3>All caught up!</h3>
            <p>No tasks assigned to you right now.</p>
          </div>
        ) : (
          <div className="mytasks-columns">
            {[...grouped.entries()].map(([title, tasksForColumn]) => {
              const accentColor = STATUS_ACCENTS[title] || "#8b6ff2";
              return (
                <div className="mytasks-group" key={title}>
                  <div className="mytasks-group__header">
                    <span className="mytasks-group__dot" style={{ background: accentColor }} />
                    <h2 className="mytasks-group__title">{title}</h2>
                    <span className="mytasks-group__count">{tasksForColumn.length}</span>
                  </div>
                  <div className="mytasks-list">
                    {tasksForColumn.map((task) => {
                      const board = boards.find((b) => b.id === task.boardId);
                      return (
                        <MotionLink
                          to={`/tasks/${task.id}`}
                          key={task.id}
                          className="mytasks-card"
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="mytasks-card__top">
                            <span className="mytasks-card__board-pill">
                              {board?.name || "Board"}
                            </span>
                            <span className="mytasks-card__id">#{task.id}</span>
                          </div>
                          <h3 className="mytasks-card__title">{task.title}</h3>
                          {task.description && (
                            <p className="mytasks-card__desc">{task.description}</p>
                          )}
                          <div className="mytasks-card__footer">
                            <span className="mytasks-card__due">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                              {task.dueDate || "No due date"}
                            </span>
                            <span className="mytasks-card__cta">
                              Open task →
                            </span>
                          </div>
                        </MotionLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default MyTasksPage;
