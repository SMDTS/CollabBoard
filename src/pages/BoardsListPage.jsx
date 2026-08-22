// BoardsListPage.jsx
import { Link } from "react-router-dom";
import mockBoards from "../data/mockBoards";
import { useToast } from "../context/ToastContext";

const ACCENTS = ["board-accent--violet", "board-accent--sky", "board-accent--iris-deep"];

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BoardsListPage() {
  const showToast = useToast();
  return (
    <div className="page-shell">
      <h1 className="page-shell__title">Your Boards</h1>
      <p className="page-shell__subtitle">Pick a board to open it.</p>

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

        {}
        <button
          type="button"
          className="board-tile board-tile--new"
          onClick={() => showToast("Creating boards needs the database (M3) — coming soon")}
        >
          <span className="board-tile__new-icon">+</span>
          New board
        </button>
      </div>
    </div>
  );
}

export default BoardsListPage;