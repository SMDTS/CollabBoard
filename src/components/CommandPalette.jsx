// CommandPalette.jsx
// Controlled from App.jsx so both the Ctrl+K shortcut and the TopBar's
// search bar open the exact same overlay, instead of duplicating search.
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import mockBoards from "../data/mockBoards";

const PAGES = [
  { label: "Boards", path: "/" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "My Tasks", path: "/my-tasks" },
  { label: "Team", path: "/team" },
  { label: "Settings", path: "/settings" },
];

function CommandPalette({ isOpen, onOpenChange }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const tasks = useTasks();

  useEffect(() => {
    function handleKeyDown(e) {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isCmdK) {
        e.preventDefault();
        onOpenChange((prev) => !prev);
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const matchedPages = PAGES.filter((p) => p.label.toLowerCase().includes(q));
  const matchedTasks = q ? tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 6) : [];

  function go(path) {
    navigate(path);
    onOpenChange(false);
  }

  return (
    <div className="cmdk-backdrop" onClick={() => onOpenChange(false)}>
      <div className="cmdk" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmdk__input"
          placeholder="Search pages or tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="cmdk__results">
          {matchedPages.length > 0 && (
            <div className="cmdk__group">
              <div className="cmdk__group-label">Pages</div>
              {matchedPages.map((p) => (
                <button key={p.path} className="cmdk__item" onClick={() => go(p.path)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {matchedTasks.length > 0 && (
            <div className="cmdk__group">
              <div className="cmdk__group-label">Tasks</div>
              {matchedTasks.map((t) => (
                // TODO: once boards have real distinct data, deep-link to
                // the exact board this task lives on instead of the first one.
                <button key={t.id} className="cmdk__item" onClick={() => go(`/boards/${mockBoards[0].id}`)}>
                  {t.title}
                  <span className="cmdk__item-meta">{t.status}</span>
                </button>
              ))}
            </div>
          )}

          {matchedPages.length === 0 && matchedTasks.length === 0 && (
            <div className="cmdk__empty">No results for "{query}"</div>
          )}
        </div>

        <div className="cmdk__footer">
          <span>
            <kbd>Esc</kbd> to close
          </span>
          <span>
            <kbd>⌘</kbd>
            <kbd>K</kbd> to toggle
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;