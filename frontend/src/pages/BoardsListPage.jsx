// BoardsListPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBoards } from "../context/BoardsContext";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";
import { AUTH_BG } from "../assets/cdn.js";
import "../styles/boardsV2.css";

import CreateBoardModal from "../components/CreateBoardModal";
import BoardSettingsModal from "../components/BoardSettingsModal";

const ACCENTS = ["bv2-accent--violet", "bv2-accent--sky", "bv2-accent--indigo"];

function initials(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function BoardsListPage() {
  const { boards, isLoading, error } = useBoards();
  const tasks = useTasks();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Default the inspector to the first board once boards actually load —
  // there's nothing to select before that.
  useEffect(() => {
    if (!selectedId && boards.length > 0) setSelectedId(boards[0].id);
  }, [boards, selectedId]);

  const selectedBoard = boards.find((b) => b.id === selectedId) || null;

  function taskCountFor(boardId) {
    return tasks.filter((t) => t.boardId === boardId).length;
  }

  function handleNewBoard() {
    setIsCreateModalOpen(true);
  }

  return (
    <motion.div
      className="page-shell bv2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bv2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bv2-bg-overlay" aria-hidden="true" />
      <div className="bv2-glow bv2-glow--a" aria-hidden="true" />
      <div className="bv2-glow bv2-glow--b" aria-hidden="true" />

      <motion.div
        className="bv2-frame"
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="bv2-header">
          <h1 className="bv2-title">Your Boards</h1>
          <p className="bv2-subtitle">Pick a board to open it.</p>
        </div>

        {isLoading && <p className="bv2-subtitle">Loading boards…</p>}
        {error && <p className="bv2-error">Couldn't load boards: {error}</p>}

        {!isLoading && !error && (
          <div className="bv2-layout">
            <div className="bv2-grid">
              {boards.map((board, i) => {
                const isSelected = selectedBoard?.id === board.id;
                return (
                  <motion.button
                    type="button"
                    key={board.id}
                    onClick={() => setSelectedId(board.id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bv2-card ${ACCENTS[i % ACCENTS.length]} ${isSelected ? "bv2-card--selected" : ""}`}
                  >
                    <div className="bv2-card__top">
                      <span className="bv2-card__avatar">{initials(board.name)}</span>
                      <span className="bv2-card__count">{taskCountFor(board.id)} tasks</span>
                    </div>
                    <div>
                      <h2 className="bv2-card__name">{board.name}</h2>
                      <p className="bv2-card__desc">{board.description || "No description yet."}</p>
                    </div>
                    <div className="bv2-card__footer">
                      <span>Open board</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </motion.button>
                );
              })}

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bv2-card bv2-card--new"
                onClick={handleNewBoard}
              >
                <span className="bv2-card__new-icon">+</span>
                New board
              </motion.button>
            </div>

            <motion.div layout className="bv2-inspector" style={{ backgroundImage: `url(${AUTH_BG})` }}>
              <div className="bv2-inspector__overlay" aria-hidden="true" />
              <AnimatePresence mode="wait">
                {selectedBoard ? (
                  <motion.div
                    key={selectedBoard.id}
                    className="bv2-inspector__content"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                  >
                    <div className="bv2-inspector__card">
                      <div className="bv2-inspector__row">
                        <span className="bv2-inspector__avatar">{initials(selectedBoard.name)}</span>
                        <h3>{selectedBoard.name}</h3>
                      </div>
                      <p>{selectedBoard.description || "No description yet."}</p>
                      <div className="bv2-inspector__footer">
                        <span>{taskCountFor(selectedBoard.id)} tasks</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {selectedBoard.ownerId === user?.id && (
                            <button
                              type="button"
                              className="bv2-inspector__cta"
                              style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "var(--bv-text)" }}
                              onClick={() => setIsSettingsModalOpen(true)}
                            >
                              Edit Settings
                            </button>
                          )}
                          <Link to={`/boards/${selectedBoard.id}`} className="bv2-inspector__cta">
                            Open board
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    className="bv2-inspector__content bv2-inspector__empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p>Create your first board to get started.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </motion.div>
      <CreateBoardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(created) => setSelectedId(created.id)}
      />
      <BoardSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        board={selectedBoard}
        onDeleted={() => setSelectedId(boards.find((b) => b.id !== selectedId)?.id || null)}
      />
    </motion.div>
  );
}

export default BoardsListPage;