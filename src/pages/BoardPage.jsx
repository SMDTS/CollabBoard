// BoardPage.jsx
import { useParams, Link } from "react-router-dom";
import mockBoards from "../data/mockBoards";
import Board from "../components/Board";

function BoardPage() {
  const { boardId } = useParams();
  const board = mockBoards.find((b) => b.id === boardId);

  if (!board) {
    return (
      <div className="board-page">
        <p>No board found with id "{boardId}".</p>
        <Link to="/boards" className="back-link">
          ← Back to boards
        </Link>
      </div>
    );
  }

  return (
    <div className="board-page">
      <Link to="/boards" className="back-link">
        ← Back to boards
      </Link>

      <div className="board-page__header">
        <h1 className="board-page__title">{board.name}</h1>
        <p className="board-page__subtitle">
          Static board — mock data for now, real state comes at M2.
        </p>
      </div>

      {/* TODO (M3 owner): tasks are still the same shared mock set
          regardless of board — swap for real per-board data once the
          backend/database exist. */}
      <Board />
    </div>
  );
}

export default BoardPage;
