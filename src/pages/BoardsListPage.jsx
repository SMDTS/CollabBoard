// BoardsListPage.jsx
import { Link } from "react-router-dom";
import mockBoards from "../data/mockBoards";
import bgShape from "../assets/auth/bg-shape.png";

// Same three accents used on Team/My Tasks, so board identity feels
// consistent with how people are color-coded elsewhere in the app.
const ACCENTS = ["board-accent--violet", "board-accent--sky", "board-accent--green"];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BoardsListPage() {
  return (
    <div
      className="boards-list-page"
      style={{
        backgroundImage: `linear-gradient(rgba(246, 246, 251, 0.82), rgba(246, 246, 251, 0.82)), url(${bgShape})`,
      }}
    >
      <h1 className="boards-list-page__title">Your Boards</h1>
      <p className="boards-list-page__subtitle">Pick a board to open it.</p>

      <div className="boards-list">
        {mockBoards.map((board, i) => (
          <Link to={`/boards/${board.id}`} key={board.id} className={`board-tile ${ACCENTS[i % ACCENTS.length]}`}>
            <div className="board-tile__top">
              <div className="board-tile__avatar">{initials(board.name)}</div>
              <span className="board-tile__count">{board.taskCount} tasks</span>
            </div>
            <h2 className="board-tile__name">{board.name}</h2>
            <p className="board-tile__desc">{board.description}</p>
            <span className="board-tile__cta">Open board →</span>
          </Link>
        ))}

        {/* TODO (M3 owner): wire this up to a real "create board" flow once boards live in the database. */}
        <button
          type="button"
          className="board-tile board-tile--new"
          onClick={() => console.log("Create board — not wired up yet")}
        >
          <span className="board-tile__new-icon">+</span>
          New board
        </button>
      </div>
    </div>
  );
}

export default BoardsListPage;