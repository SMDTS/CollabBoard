// BoardPage.jsx
import Board from "../components/Board";

function BoardPage() {
  return (
    <div className="board-page">
      <div className="board-page__header">
        <h1 className="board-page__title">Product Launch</h1>
      </div>
      <Board />
    </div>
  );
}

export default BoardPage;
