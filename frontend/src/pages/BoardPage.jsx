// BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { getColumns } from "../utils/columns";
import Board from "../components/Board";
import TaskDetailPanel from "../components/TaskDetailPanel";
import { avatarColor } from "../utils/avatarColor";
import { fetchBoardMembers } from "../api/boards.js";

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
  const { boards, isLoading } = useBoards();
  // boardId is a Mongo ObjectId string (e.g. "507f1f77bcf86cd799439011"),
  // not a number — Number(boardId) here used to be NaN for every real
  // board, which meant no board could ever be found once boards moved
  // off the old in-memory integer ids.
  const board = boards.find((b) => b.id === boardId);
  const tasks = useTasks();
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [members, setMembers] = useState([]);

  const isOwner = !!board && board.ownerId === user?.id;

  useEffect(() => {
    if (!board) return;
    let cancelled = false;
    fetchBoardMembers(board.id)
      .then((m) => {
        if (!cancelled) setMembers(m);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [board?.id]);

  if (isLoading) {
    return (
      <div className="page-shell">
        <p className="page-shell__subtitle">Loading board…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="page-shell">
        <p>No board found with id "{boardId}".</p>
        <Link to="/" className="back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
        </Link>
      </div>
    );
  }

  const boardTasks = tasks.filter((t) => t.boardId === boardId);
  // "Done" isn't a field on the task anymore — it's whichever embedded
  // column on this board is titled "Done" (the default seed data always
  // has one; a board with custom column names may not).
  const doneColumn = getColumns(board).find((c) => c.title === "Done");
  const doneCount = doneColumn ? boardTasks.filter((t) => t.columnId === doneColumn.id).length : 0;
  const totalCount = boardTasks.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const assignees = [...new Set(boardTasks.map((t) => t.assignee))];

  return (
    <div className="page-shell">
      <Link to="/" className="back-link">
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
              style={{ background: avatarColor(name) }}
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

      <Board
        board={board}
        onOpenTask={setSelectedTaskId}
        isOwner={isOwner}
        currentUserId={user?.id}
        members={members}
      />

      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          isOwner={isOwner}
          currentUserId={user?.id}
          members={members}
        />
      )}
    </div>
  );
}

export default BoardPage;