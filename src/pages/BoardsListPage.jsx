// BoardsListPage.jsx
import { Link } from "react-router-dom";
import mockBoards from "../data/mockBoards";

function BoardsListPage() {
  return (
    <div className="boards-list-page">
      <h1 className="boards-list-page__title">Your Boards</h1>
      <p className="boards-list-page__subtitle">Pick a board to open it.</p>

      <div className="boards-list">
        {mockBoards.map((board) => (
          <Link to={`/boards/${board.id}`} key={board.id} className="board-tile">
            <h2 className="board-tile__name">{board.name}</h2>
            <p className="board-tile__desc">{board.description}</p>
            <span className="board-tile__count">{board.taskCount} tasks</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BoardsListPage;
