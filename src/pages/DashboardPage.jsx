// DashboardPage.jsx
import { Link } from "react-router-dom";
import mockTasks from "../data/mockTasks";
import mockBoards from "../data/mockBoards";
import dashboardBg from "../assets/dashboard/dashboard-bg.jpg";

const STATUSES = ["To Do", "Doing", "Done"];

// Colors sampled directly from dashboard-bg.jpg's four blobs, so every
// accent on this page is drawn from the actual background artwork.
const STAT_ACCENTS = {
  Total: { className: "dash-stat--iris-deep", hex: "#af8f76" },
  "To Do": { className: "dash-stat--violet", hex: "#d0ac8c" },
  Doing: { className: "dash-stat--sky", hex: "#e5d2b4" },
  Done: { className: "dash-stat--iris", hex: "#ebdcc7" },
};

const BOARD_ACCENTS = ["dash-accent--iris", "dash-accent--violet", "dash-accent--sky"];

// TODO (M5 owner): replace with a real activity feed once Socket.io is wired up.
const MOCK_ACTIVITY = [
  { id: 1, text: "Sarah moved \"Build TaskCard component\" to Doing" },
  { id: 2, text: "Jordan completed \"Install dependencies\"" },
  { id: 3, text: "Priya added a new task to Product Launch" },
  { id: 4, text: "Sarah created the Marketing Site board" },
  { id: 5, text: "Jordan commented on \"Style board layout with flexbox\"" },
];

function DashboardPage() {
  const total = mockTasks.length;
  const counts = STATUSES.reduce((acc, status) => {
    acc[status] = mockTasks.filter((t) => t.status === status).length;
    return acc;
  }, {});

  const statCards = [
    { label: "Total tasks", value: total, pct: 100, ...STAT_ACCENTS.Total },
    ...STATUSES.map((status) => ({
      label: status,
      value: counts[status],
      pct: total ? Math.round((counts[status] / total) * 100) : 0,
      ...STAT_ACCENTS[status],
    })),
  ];

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage: `linear-gradient(rgba(250, 242, 229, 0.62), rgba(250, 242, 229, 0.62)), url(${dashboardBg})`,
      }}
    >
      <h1 className="dash-page__title">Dashboard</h1>
      <p className="dash-page__subtitle">
        A quick look across your boards. Mock data for now — real per-board stats come at M3.
      </p>

      <div className="dash-stats">
        {statCards.map((stat) => (
          <div className={`dash-stat ${stat.className}`} key={stat.label}>
            <span className="dash-stat__value">{stat.value}</span>
            <span className="dash-stat__label">{stat.label}</span>
            <div className="dash-stat__bar">
              <div className="dash-stat__bar-fill" style={{ width: `${stat.pct}%`, background: stat.hex }} />
            </div>
            <span className="dash-stat__pct">{stat.pct}% of total</span>
          </div>
        ))}
      </div>

      <div className="dash-columns">
        <section className="dash-section">
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

        <section className="dash-section">
          <h2 className="dash-section__title">Recent activity</h2>
          <ul className="dash-activity">
            {MOCK_ACTIVITY.map((item, i) => (
              <li key={item.id} className={`dash-activity__item ${BOARD_ACCENTS[i % BOARD_ACCENTS.length]}`}>
                <span className="dash-activity__dot" />
                {item.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;