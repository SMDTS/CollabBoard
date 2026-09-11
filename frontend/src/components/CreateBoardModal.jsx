// CreateBoardModal.jsx
import { useState, useEffect, useRef } from "react";
import { useBoardsActions } from "../context/BoardsContext";
import { useToast } from "../context/ToastContext";
import { AUTH_BG } from "../assets/cdn.js";

function CreateBoardModal({ isOpen, onClose, onSuccess }) {
  const { addBoard } = useBoardsActions();
  const showToast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setName("");
    setDescription("");
    setIsSubmitting(false);
    const t = setTimeout(() => nameRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = name.trim() && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const created = await addBoard(name.trim(), description.trim());
      showToast(`Created board "${name.trim()}"`, "success");
      onClose();
      if (onSuccess) onSuccess(created);
    } catch (err) {
      showToast(err.message || "Couldn't create board", "error");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bp2-modal-backdrop" onClick={onClose} />
      <div className="bp2-modal" role="dialog" aria-modal="true" aria-label="Create board">
        <form className="bp2-modal__card" onSubmit={handleSubmit}>
          <div className="bp2-modal__card-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
          <div className="bp2-modal__card-overlay" aria-hidden="true" />
          <div className="bp2-modal__card-glow" aria-hidden="true" />
          <div className="bp2-modal__header">
            <h2 className="bp2-modal__title">Create New Board</h2>
            <button type="button" className="bp2-modal__close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="bp2-modal__body">
            <div className="bp2-modal__field">
              <label className="bp2-modal__label" htmlFor="board-name">Board Title</label>
              <input
                id="board-name"
                ref={nameRef}
                className="bp2-modal__input"
                placeholder="e.g. Product Roadmap, Q3 Sprint..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="bp2-modal__field">
              <label className="bp2-modal__label" htmlFor="board-description">Description (optional)</label>
              <textarea
                id="board-description"
                className="bp2-modal__textarea"
                placeholder="Describe the main goal of this board..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="bp2-modal__footer">
            <button type="button" className="bp2-modal__btn bp2-modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bp2-modal__btn bp2-modal__btn--primary" disabled={!canSubmit}>
              {isSubmitting ? "Creating..." : "Create board"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateBoardModal;
