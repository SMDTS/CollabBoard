// BoardPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { getColumns } from "../utils/columns";
import Board from "../components/Board";
import TaskDetailPanel from "../components/TaskDetailPanel";
import BoardSettingsModal from "../components/BoardSettingsModal";
import { avatarColor } from "../utils/avatarColor";
import { fetchBoardMembers } from "../api/boards.js";
import { AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "../components/UserAvatar.jsx";
import "../styles/boardPageV2.css";

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
  const navigate = useNavigate();
  const { boards, isLoading } = useBoards();
  // boardId is a Mongo ObjectId string (e.g. "507f1f77bcf86cd799439011"),
  // not a number — Number(boardId) here used to be NaN for every real
  // board, which meant no board could ever be found once boards moved
  // off the old in-memory integer ids.
  const board = boards.find((b) => b.id === boardId);
  const tasks = useTasks();
  const { user } = useAuth();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
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
      <div className="page-shell bp2">
        <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-bg-overlay" aria-hidden="true" />
        <p className="bp2-subtitle" style={{ position: "relative", zIndex: 1, color: "#a3a3b8" }}>Loading board…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="page-shell bp2">
        <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
        <div className="bp2-bg-overlay" aria-hidden="true" />
        <p style={{ position: "relative", zIndex: 1, color: "#fff" }}>No board found with id "{boardId}".</p>
        <Link to="/" className="bp2-back-link">
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
    <motion.div
      className="page-shell bp2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      <motion.div
        className="bp2-frame"
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Link to="/" className="bp2-back-link">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to boards
        </Link>

        {/* This is the morph destination — it shares a layoutId with
            whichever board card (on BoardsListPage or DashboardPage) the
            user clicked to get here, so Framer Motion animates the card's
            shrinking/repositioning into this header instead of just
            cutting between two unrelated layouts. */}
        <motion.div layoutId={`board-card-${board.id}`} className="bp2-header">
          <div className="bp2-header__avatar">{initials(board.name)}</div>
          <div className="bp2-header__heading">
            <h1 className="bp2-header__title">{board.name}</h1>
          </div>

          {isOwner && (
            <button
              type="button"
              className="bp2-panel__status-btn"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Board Settings"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                flex: "0 0 auto",
                width: "auto",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          )}

          <div className="bp2-header__people">
            {assignees.map((name) => {
              const member = members.find((m) => m.name === name);
              return <UserAvatar key={name} user={member} name={name} size={28} className="bp2-header__person" title={name} />;
            })}
          </div>

          <div className="bp2-header__progress">
            <div className="bp2-header__progress-track">
              <div className="bp2-header__progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="bp2-header__progress-label">
              {doneCount}/{totalCount} done
            </span>
          </div>
        </motion.div>

        <Board
          board={board}
          onOpenTask={setSelectedTaskId}
          isOwner={isOwner}
          currentUserId={user?.id}
          members={members}
        />
      </motion.div>

      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={board}
        onDeleted={() => navigate("/")}
      />

      <AnimatePresence>
        {selectedTaskId && (
          <TaskDetailPanel
            key={selectedTaskId}
            taskId={selectedTaskId}
            onClose={() => setSelectedTaskId(null)}
            isOwner={isOwner}
            currentUserId={user?.id}
            members={members}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default BoardPage;