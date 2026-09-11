// Board.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { useTasks } from "../context/TasksContext";
import { getColumns } from "../utils/columns";
import Column from "./Column";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";

const BOARD_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

function Board({ board, onOpenTask, isOwner, currentUserId, members }) {
  const tasks = useTasks();
  const columns = getColumns(board);

  const [addTaskColumnId, setAddTaskColumnId] = useState(null);

  return (
    <motion.div
      className="board"
      variants={BOARD_VARIANTS}
      initial="hidden"
      animate="show"
    >
      {columns.map((column) => {
        const tasksForColumn = tasks.filter(
          (task) => task.boardId === board.id && task.columnId === column.id
        );

        return (
          <Column
            key={column.id}
            columnId={column.id}
            title={column.title}
            boardId={board.id}
            isOwner={isOwner}
            onAddTask={() => setAddTaskColumnId(column.id)}
          >
            {tasksForColumn.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                assignee={task.assignee}
                assigneeId={task.assigneeId}
                members={members}
                dueDate={task.dueDate}
                columnTitle={column.title}
                onOpen={onOpenTask}
                // Only the board owner, or the person this card is
                // assigned to, may drag it between columns.
                canDrag={isOwner || task.assigneeId === currentUserId}
              />
            ))}
          </Column>
        );
      })}

      <CreateTaskModal
        isOpen={!!addTaskColumnId}
        onClose={() => setAddTaskColumnId(null)}
        boardId={board.id}
        columns={columns}
        members={members}
        defaultColumnId={addTaskColumnId}
      />
    </motion.div>
  );
}

export default Board;
