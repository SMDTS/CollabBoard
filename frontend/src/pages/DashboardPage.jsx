// DashboardPage.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useTasks } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { fetchActivity } from "../api/activity.js";
import BubbleBackground from "../components/BubbleBackground";

import { columnTitle } from "../utils/columns";

const STATUSES = ["To Do", "Doing", "Done"];

const STAT_ICONS = {
  Total: { className: "dash-stat--iris-deep", icon: "layers" },
  "To Do": { className: "dash-stat--violet", icon: "circle" },
  Doing: { className: "dash-stat--sky", icon: "clock" },
  Done: { className: "dash-stat--iris", icon: "check" },
};

const BOARD_ACCENTS = ["dash-accent--iris", "dash-accent--violet", "dash-accent--sky"];

// One fetch on mount, same pattern as BoardsContext/TasksContext — kept
// local to this page rather than a full context since Dashboard is the
// only place the global activity feed is shown right now.
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
  const { activity, isLoading: activityLoading, error: activityError } = useActivity();
  const total = tasks.length;
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => {
      const board = boards.find((b) => b.id === t.boardId);
      return columnTitle(board, t.columnId) === status;
    }).length;
    return acc;
  }, {});

  const statCards = [
    { label: "Total tasks", value: total, ...STAT_ICONS.Total },
    ...STATUSES.map((status) => ({
      label: status,
      value: counts[status],
      ...STAT_ICONS[status],
    })),
  ];

  return (
    <div className="page-shell dash-page">
      <BubbleBackground interactive className="dash-bg" />

      <div className="dash-content">
        <h1 className="page-shell__title">Dashboard</h1>
        <p className="page-shell__subtitle">A quick look across your boards.</p>

        <div className="dash-stats">
        {statCards.map((stat) => (
          <div className={`dash-stat ${stat.className}`} key={stat.label}>
            <div className="dash-stat__icon">
              <StatIcon name={stat.icon} />
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{stat.value}</span>
              <span className="dash-stat__label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-columns">
        <section>
          <h2 className="dash-section__title">Your boards</h2>
          <div className="dash-boards">
            {boards.map((board, i) => (
              <Link
                to={`/boards/${board.id}`}
                key={board.id}
                className={`dash-board-card ${BOARD_ACCENTS[i % BOARD_ACCENTS.length]}`}
              >
                <div className="dash-board-card__top">
                  <span className="dash-board-card__dot" />
                  <span className="dash-board-card__name">{board.name}</span>
                </div>
                <p className="dash-board-card__desc">{board.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="dash-section__title">Recent activity</h2>
          <div className="dash-activity-wrap">
            {activityLoading ? (
              <p className="dash-activity__empty">Loading activity…</p>
            ) : activityError ? (
              <p className="dash-activity__empty">Couldn't load activity: {activityError}</p>
            ) : activity.length === 0 ? (
              <p className="dash-activity__empty">No activity yet — create or move a task to see it here.</p>
            ) : (
              <ul className="dash-activity">
                {activity.map((item, i) => (
                  <li key={item.id} className={`dash-activity__item ${BOARD_ACCENTS[i % BOARD_ACCENTS.length]}`}>
                    <span className="dash-activity__dot" />
                    {item.message}
                  </li>
                ))}
              </ul>
            )}
            <div className="dash-activity-fade" />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;