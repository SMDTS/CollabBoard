// DashboardPage.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTasks } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { fetchActivity } from "../api/activity.js";
import { columnTitle } from "../utils/columns";
import { AUTH_BG } from "../assets/cdn.js";
import "../styles/dashboardV2.css";

const STATUSES = ["To Do", "Doing", "Done"];

const STAT_ICONS = {
  Total: { className: "dashv2-stat--total", icon: "layers" },
  "To Do": { className: "dashv2-stat--todo", icon: "circle" },
  Doing: { className: "dashv2-stat--doing", icon: "clock" },
  Done: { className: "dashv2-stat--done", icon: "check" },
};

const MotionLink = motion.create(Link);

const FRAME_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const STAT_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const STAT_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const LIST_CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const LIST_ITEM_VARIANTS = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2 } },
};

function useActivity() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchActivity()
      .then((data) => {
        if (!cancelled) setActivity(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { activity, isLoading, error };
}

function StatIcon({ name }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "layers") {
    return (
      <svg {...common}>
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
  }
  if (name === "circle") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DashboardPage() {
  const { boards } = useBoards();
  const tasks = useTasks();
  const { user } = useAuth();
  const { activity, isLoading: activityLoading, error: activityError } = useActivity();

  const total = tasks.length;
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => {
      const board = boards.find((b) => b.id === t.boardId);
      return columnTitle(board, t.columnId) === status;
    }).length;
    return acc;
  }, {});

  const donePct = total ? Math.round((counts["Done"] / total) * 100) : 0;
  const myTasks = tasks.filter((t) => t.assigneeId === user?.id);

  const statCards = [
    { label: "Total tasks", value: total, detail: "Across all boards", ...STAT_ICONS.Total },
    { label: "To Do", value: counts["To Do"], detail: "Pending action", ...STAT_ICONS["To Do"] },
    { label: "In Progress", value: counts["Doing"], detail: "Currently active", ...STAT_ICONS.Doing },
    { label: "Completed", value: `${counts["Done"]} (${donePct}%)`, detail: "Finished tasks", ...STAT_ICONS.Done },
  ];

  return (
    <div className="page-shell dashv2">
      <div className="dashv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="dashv2-bg-overlay" aria-hidden="true" />
      <div className="dashv2-glow dashv2-glow--a" aria-hidden="true" />
      <div className="dashv2-glow dashv2-glow--b" aria-hidden="true" />

      <motion.div className="dashv2-frame" variants={FRAME_VARIANTS} initial="hidden" animate="show">
        
        {/* Hero Welcome Banner */}
        <div className="dashv2-hero">
          <div className="dashv2-hero__content">
            <h1 className="dashv2-hero__title">
              Welcome back, <span className="dashv2-hero__name">{user?.name || "Member"}</span>! 👋
            </h1>
            <p className="dashv2-hero__subtitle">
              Here is your high-level overview across all active workspace boards and tasks.
            </p>
          </div>
          <div className="dashv2-hero__actions">
            <Link to="/" className="dashv2-hero__btn dashv2-hero__btn--primary">
              View All Boards
            </Link>
            <Link to="/my-tasks" className="dashv2-hero__btn dashv2-hero__btn--ghost">
              My Tasks ({myTasks.length})
            </Link>
          </div>
        </div>

        {/* 4 Metric Stats Grid */}
        <motion.div className="dashv2-stats" variants={STAT_CONTAINER_VARIANTS} initial="hidden" animate="show">
          {statCards.map((stat) => (
            <motion.div
              className={`dashv2-stat ${stat.className}`}
              key={stat.label}
              variants={STAT_ITEM_VARIANTS}
              whileHover={{ y: -4, scale: 1.01 }}
            >
              <div className="dashv2-stat__icon">
                <StatIcon name={stat.icon} />
              </div>
              <div className="dashv2-stat__info">
                <span className="dashv2-stat__value">{stat.value}</span>
                <span className="dashv2-stat__label">{stat.label}</span>
                <span className="dashv2-stat__detail">{stat.detail}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Full-Bleed 3-Column Section Grid */}
        <div className="dashv2-grid-3">
          
          {/* Section 1: Active Boards */}
          <section className="dashv2-panel">
            <div className="dashv2-panel__header">
              <h2 className="dashv2-panel__title">Active Boards</h2>
              <span className="dashv2-panel__badge">{boards.length}</span>
            </div>
            <motion.div className="dashv2-boards-list" variants={LIST_CONTAINER_VARIANTS} initial="hidden" animate="show">
              {boards.map((board) => {
                const bTasks = tasks.filter((t) => t.boardId === board.id);
                const bDone = bTasks.filter((t) => columnTitle(board, t.columnId) === "Done").length;
                const bPct = bTasks.length ? Math.round((bDone / bTasks.length) * 100) : 0;

                return (
                  <MotionLink
                    to={`/boards/${board.id}`}
                    key={board.id}
                    variants={LIST_ITEM_VARIANTS}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    className="dashv2-board-card"
                  >
                    <div className="dashv2-board-card__top">
                      <span className="dashv2-board-card__name">{board.name}</span>
                      <span className="dashv2-board-card__count">{bTasks.length} tasks</span>
                    </div>
                    <p className="dashv2-board-card__desc">{board.description || "No description."}</p>
                    <div className="dashv2-board-card__progress">
                      <div className="dashv2-board-card__track">
                        <div className="dashv2-board-card__fill" style={{ width: `${bPct}%` }} />
                      </div>
                      <span className="dashv2-board-card__pct">{bPct}% done</span>
                    </div>
                  </MotionLink>
                );
              })}
            </motion.div>
          </section>

          {/* Section 2: My Assigned Tasks */}
          <section className="dashv2-panel">
            <div className="dashv2-panel__header">
              <h2 className="dashv2-panel__title">My Tasks</h2>
              <span className="dashv2-panel__badge">{myTasks.length}</span>
            </div>
            <div className="dashv2-mytasks-wrap">
              {myTasks.length === 0 ? (
                <div className="dashv2-empty-state">
                  <span className="dashv2-empty-state__icon">✓</span>
                  <p>All caught up! No tasks assigned to you right now.</p>
                </div>
              ) : (
                <motion.div className="dashv2-mytasks-list" variants={LIST_CONTAINER_VARIANTS} initial="hidden" animate="show">
                  {myTasks.slice(0, 5).map((task) => {
                    const board = boards.find((b) => b.id === task.boardId);
                    const colName = columnTitle(board, task.columnId);
                    return (
                      <MotionLink
                        to={`/tasks/${task.id}`}
                        key={task.id}
                        variants={LIST_ITEM_VARIANTS}
                        whileHover={{ y: -2 }}
                        className="dashv2-task-card"
                      >
                        <div className="dashv2-task-card__top">
                          <span className="dashv2-task-card__board">{board?.name || "Board"}</span>
                          <span className={`dashv2-task-card__status dashv2-task-card__status--${colName.toLowerCase().replace(" ", "-")}`}>
                            {colName}
                          </span>
                        </div>
                        <h3 className="dashv2-task-card__title">{task.title}</h3>
                        {task.dueDate && (
                          <span className="dashv2-task-card__due">
                            📅 {task.dueDate}
                          </span>
                        )}
                      </MotionLink>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </section>

          {/* Section 3: Recent Activity */}
          <section className="dashv2-panel">
            <div className="dashv2-panel__header">
              <h2 className="dashv2-panel__title">Recent Activity</h2>
              <span className="dashv2-panel__badge">{activity.length}</span>
            </div>
            <div className="dashv2-activity-wrap">
              {activityLoading ? (
                <p className="dashv2-activity__empty">Loading activity…</p>
              ) : activityError ? (
                <p className="dashv2-activity__empty">Couldn't load activity: {activityError}</p>
              ) : activity.length === 0 ? (
                <p className="dashv2-activity__empty">No activity recorded yet.</p>
              ) : (
                <motion.ul className="dashv2-activity" variants={LIST_CONTAINER_VARIANTS} initial="hidden" animate="show">
                  {activity.map((item) => (
                    <motion.li key={item.id} className="dashv2-activity__item" variants={LIST_ITEM_VARIANTS}>
                      <span className="dashv2-activity__dot" />
                      <div className="dashv2-activity__content">
                        <p className="dashv2-activity__msg">{item.message}</p>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>
          </section>

        </div>
      </motion.div>
    </div>
  );
}

export default DashboardPage;