// CreateTaskModal.jsx
import { useState, useEffect, useRef } from "react";
import { useTasksActions } from "../context/TasksContext";
import { useToast } from "../context/ToastContext";
import DateTimePicker from "./DateTimePicker";

function CreateTaskModal({ isOpen, onClose, boardId, columns = [], members = [], defaultColumnId }) {
  const { addTask } = useTasksActions();
  const showToast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(defaultColumnId || columns[0]?.id || "");
  const [assigneeId, setAssigneeId] = useState(members[0]?.id || "");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef(null);


  useEffect(() => {
    if (!isOpen) return;
    setTitle("");
    setDescription("");
    setColumnId(defaultColumnId || columns[0]?.id || "");
    setAssigneeId(members[0]?.id || "");
    setDueDate("");
    setIsSubmitting(false);
    // Focus the title field once the modal has actually mounted.
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [isOpen, defaultColumnId, columns, members]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const canSubmit = title.trim() && columnId && assigneeId && !isSubmitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    const assigneeName = members.find((m) => m.id === assigneeId)?.name || "";
    try {
      await addTask({
        columnId,
        title,
        boardId,
        assigneeId,
        assigneeName,
        dueDate,
        description,
      });
      showToast(`Added "${title.trim()}"`, "success");
      onClose();
    } catch (err) {
      showToast(err.message || "Couldn't create the task", "error");
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal" role="dialog" aria-modal="true" aria-label="Create task">
        <form className="modal__card" onSubmit={handleSubmit}>
          <div className="modal__header">
            <h2 className="modal__title">New task</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="modal__body">
            <div className="modal__field">
              <label className="modal__label" htmlFor="task-title">Title</label>
              <input
                id="task-title"
                ref={titleRef}
                className="modal__input"
                placeholder="e.g. Design the empty-state illustration"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="modal__field">
              <label className="modal__label" htmlFor="task-description">Description</label>
              <textarea
                id="task-description"
                className="modal__textarea"
                placeholder="Add more detail about this task… (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="modal__row">
              <div className="modal__field">
                <label className="modal__label" htmlFor="task-status">Status</label>
                <select
                  id="task-status"
                  className="modal__input"
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal__field">
                <label className="modal__label" htmlFor="task-assignee">Assignee</label>
                <select
                  id="task-assignee"
                  className="modal__input"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                >
                  {members.length === 0 && <option value="">No members yet</option>}
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label" htmlFor="task-due">Due date &amp; time</label>
              <DateTimePicker value={dueDate} onChange={setDueDate} />
            </div>
          </div>

          <div className="modal__footer">
            <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal__btn modal__btn--primary" disabled={!canSubmit}>
              {isSubmitting ? "Adding…" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateTaskModal;
