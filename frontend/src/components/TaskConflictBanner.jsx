import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, UserCheck, RefreshCw } from "lucide-react";
import { useTaskConflicts, useTasksActions } from "../context/TasksContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";
import { columnTitle } from "../utils/columns.js";
import "../styles/taskConflict.css";

const FIELDS = ["title", "assignee"];

export function TaskConflictBanner() {
  const conflicts = useTaskConflicts();
  const { resolveConflict } = useTasksActions();
  const { boards } = useBoards();

  if (!conflicts.length) return null;

  return (
    <div className="conflict-stack" role="alert">
      <AnimatePresence>
        {conflicts.map(({ taskId, localTask, serverTask }) => {
          const board = boards.find((b) => b.id === localTask.boardId);
          // Column ids aren't meaningful to a person — show the column's
          // title on each side instead of the raw id.
          const localWithColumn = { ...localTask, column: columnTitle(board, localTask.columnId) };
          const serverWithColumn = { ...serverTask, column: columnTitle(board, serverTask.columnId) };

          return (
            <motion.div
              className="conflict-card"
              key={taskId}
              initial={{ opacity: 0, y: -25, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
            >
              <div className="conflict-card__header">
                <div className="conflict-card__badge" aria-hidden="true">
                  <AlertTriangle size={18} />
                </div>
                <p className="conflict-card__title">
                  "{localTask.title}" changed on another device while you were editing it.
                </p>
              </div>

              <div className="conflict-card__versions">
                <VersionColumn
                  label="Your version"
                  type="mine"
                  task={localWithColumn}
                  other={serverWithColumn}
                />
                <VersionColumn
                  label="Latest version"
                  type="latest"
                  task={serverWithColumn}
                  other={localWithColumn}
                />
              </div>

              <div className="conflict-card__actions">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="conflict-card__btn conflict-card__btn--local"
                  onClick={() => resolveConflict(taskId, "keepLocal")}
                >
                  <UserCheck size={16} />
                  Keep mine
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="conflict-card__btn conflict-card__btn--server"
                  onClick={() => resolveConflict(taskId, "keepServer")}
                >
                  <RefreshCw size={16} />
                  Use latest
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function VersionColumn({ label, type, task, other }) {
  return (
    <div className={`conflict-card__version conflict-card__version--${type}`}>
      <h4>{label}</h4>
      <dl>
        {[...FIELDS, "column"].map((field) => {
          const isDiff = task[field] !== other[field];
          return (
            <div
              className={`conflict-card__field ${isDiff ? "conflict-card__field--diff" : ""}`}
              key={field}
            >
              <dt>{field}</dt>
              <dd>{String(task[field] ?? "—")}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
