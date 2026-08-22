// DashboardPage.jsx
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import mockBoards from "../data/mockBoards";
import BubbleBackground from "../components/BubbleBackground";

const STATUSES = ["To Do", "Doing", "Done"];

const STAT_ICONS = {
  Total: { className: "dash-stat--iris-deep", icon: "layers" },
  "To Do": { className: "dash-stat--violet", icon: "circle" },
  Doing: { className: "dash-stat--sky", icon: "clock" },
  Done: { className: "dash-stat--iris", icon: "check" },
};

const BOARD_ACCENTS = ["dash-accent--iris", "dash-accent--violet", "dash-accent--sky"];

// TODO (M5 owner): replace with a real activity feed once Socket.io is wired up.
const MOCK_ACTIVITY = [
  { id: 1, text: "Sarah moved \"Build TaskCard component\" to Doing" },
  { id: 2, text: "Jordan completed \"Install dependencies\"" },
  { id: 3, text: "Priya added a new task to Product Launch" },
  { id: 4, text: "Sarah created the Marketing Site board" },
  { id: 5, text: "Jordan commented on \"Style board layout with flexbox\"" },
  { id: 6, text: "Priya moved \"Write API spec for tasks endpoint\" to Doing" },
  { id: 7, text: "Sarah updated the due date on \"Draft onboarding wireframes\"" },
  { id: 8, text: "Jordan reassigned \"Confirm dev server runs\" to Priya" },
];

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
  const mockTasks = useTasks();
  const total = mockTasks.length;
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = mockTasks.filter((t) => t.status === status).length;
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
            {mockBoards.map((board, i) => (
              <Link
                to={`/boards/${board.id}`}
                key={board.id}
                className={`dash-board-card ${BOARD_ACCENTS[i % BOARD_ACCENTS.length]}`}
              >
                <div className="dash-board-card__top">
                  <span className="dash-board-card__dot" />
                  <span className="dash-board-card__name">{board.name}</span>
                  <span className="dash-board-card__count">{board.taskCount} tasks</span>
                </div>
                <p className="dash-board-card__desc">{board.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="dash-section__title">Recent activity</h2>
          <div className="dash-activity-wrap">
            <ul className="dash-activity">
              {MOCK_ACTIVITY.map((item, i) => (
                <li key={item.id} className={`dash-activity__item ${BOARD_ACCENTS[i % BOARD_ACCENTS.length]}`}>
                  <span className="dash-activity__dot" />
                  {item.text}
                </li>
              ))}
            </ul>
            <div className="dash-activity-fade" />
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;