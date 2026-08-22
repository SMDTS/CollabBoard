// BoardPage.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import mockBoards from "../data/mockBoards";
import { useTasks } from "../context/TasksContext";
import Board from "../components/Board";
import TaskDetailPanel from "../components/TaskDetailPanel";

const ASSIGNEE_COLORS = {
  Sarah: "var(--cb-violet)",
  Jordan: "var(--cb-sky)",
  Priya: "var(--cb-success)",
};

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BoardPage() {
  const { boardId } = useParams();
  const board = mockBoards.find((b) => b.id === boardId);
  const tasks = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  if (!board) {
    return (
      <div className="page-shell">
        <p>No board found with id "{boardId}".</p>
        <Link to="/boards" className="back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
        </Link>
      </div>
    );
  }

  // TODO (M3 owner): tasks are still the same shared mock set regardless of
  // board — swap for real per-board data once the backend/database exist.
  const doneCount = tasks.filter((t) => t.status === "Done").length;
  const totalCount = tasks.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const assignees = [...new Set(tasks.map((t) => t.assignee))];

  return (
    <div className="page-shell">
      <Link to="/boards" className="back-link">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
      </Link>

      <div className="board-page__header">
        <div className="board-page__avatar">{initials(board.name)}</div>
        <div className="board-page__heading">
          <h1 className="board-page__title">{board.name}</h1>
        </div>

        <div className="board-page__people">
          {assignees.map((name) => (
            <div
              key={name}
              className="board-page__person"
              style={{ background: ASSIGNEE_COLORS[name] || "var(--cb-text-muted)" }}
              title={name}
            >
              {initials(name)}
            </div>
          ))}
        </div>

        <div className="board-page__progress">
          <div className="board-page__progress-track">
            <div className="board-page__progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="board-page__progress-label">
            {doneCount}/{totalCount} done
          </span>
        </div>
      </div>

      <Board onOpenTask={setSelectedTaskId} />

      {selectedTaskId && <TaskDetailPanel taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />}
    </div>
  );
}

export default BoardPage;