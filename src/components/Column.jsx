// Column.jsx
function Column({ title, children }) {
  return (
    <div className="board-column">
      <div className="board-column__header">
        <h2 className="board-column__title">{title}</h2>
        <span className="board-column__count">{children.length}</span>
      </div>
      <div className="board-column__cards">{children}</div>
    </div>
  );
}

export default Column;
