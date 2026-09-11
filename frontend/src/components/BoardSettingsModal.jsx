// BoardSettingsModal.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBoardsActions } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { AUTH_BG } from "../assets/cdn.js";

export default function BoardSettingsModal({ isOpen, onClose, board, onDeleted }) {
  const { editBoard, removeBoard } = useBoardsActions();
  const showToast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.name || "");
      setDescription(board.description || "");
      setConfirmDelete(false);
    }
  }, [board]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen && !isSaving && !isDeleting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSaving, isDeleting, onClose]);

  if (!board) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast("Board name cannot be empty", "error");
      return;
    }

    setIsSaving(true);
    try {
      await editBoard(board.id, { name: trimmedName, description: description.trim() });
      showToast("Board settings saved", "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Failed to update board", "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    try {
      await removeBoard(board.id);
      showToast(`Deleted board "${board.name}"`, "info");
      onClose();
      onDeleted?.();
    } catch (err) {
      showToast(err.message || "Failed to delete board", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="bp2-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSaving || isDeleting ? undefined : onClose}
          />
          <div className="bp2-modal" role="dialog" aria-modal="true">
            <motion.div
              className="bp2-modal__card"
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="bp2-modal__card-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
              <div className="bp2-modal__card-overlay" aria-hidden="true" />
              <div className="bp2-modal__card-glow" aria-hidden="true" />

              <div className="bp2-modal__header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: "rgba(139, 111, 242, 0.15)",
                      border: "1px solid rgba(139, 111, 242, 0.3)",
                      color: "#8b6ff2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <h2 className="bp2-modal__title">Board Settings</h2>
                </div>
                {!isSaving && !isDeleting && (
                  <button type="button" className="bp2-modal__close" onClick={onClose} aria-label="Close">
                    ×
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit}>
                <div className="bp2-modal__body">
                  <div className="bp2-modal__field">
                    <label className="bp2-modal__label" htmlFor="board-settings-name">
                      Board Name
                    </label>
                    <input
                      id="board-settings-name"
                      className="bp2-modal__input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Q4 Product Roadmap"
                      required
                    />
                  </div>

                  <div className="bp2-modal__field">
                    <label className="bp2-modal__label" htmlFor="board-settings-desc">
                      Description
                    </label>
                    <textarea
                      id="board-settings-desc"
                      className="bp2-modal__textarea"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What is this board for?"
                      rows={3}
                    />
                  </div>

                  <div style={{ paddingTop: 8, borderTop: "1px solid var(--bp-border, rgba(255,255,255,0.08))" }}>
                    <span className="bp2-modal__label" style={{ color: "#ef4444", marginBottom: 8, display: "block" }}>
                      Danger Zone
                    </span>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "var(--bp-text-dim, #a3a3b8)" }}>
                        {confirmDelete ? "Click again to permanently delete" : "Delete this board and all its tasks"}
                      </span>
                      <button
                        type="button"
                        className="bp2-panel__delete"
                        style={{ marginTop: 0, padding: "8px 14px" }}
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "Deleting…" : confirmDelete ? "Confirm Delete" : "Delete Board"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bp2-modal__footer">
                  <button
                    type="button"
                    className="bp2-modal__btn bp2-modal__btn--ghost"
                    onClick={onClose}
                    disabled={isSaving || isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bp2-modal__btn bp2-modal__btn--primary"
                    disabled={isSaving || isDeleting}
                  >
                    {isSaving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
