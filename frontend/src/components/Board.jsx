// Board.jsx
import { useState } from "react";
import { useTasks } from "../context/TasksContext";
import { getColumns } from "../utils/columns";
import Column from "./Column";
import TaskCard from "./TaskCard";
import CreateTaskModal from "./CreateTaskModal";

function Board({ board, onOpenTask, isOwner, currentUserId, members }) {
  const tasks = useTasks();
  const columns = getColumns(board);

  const [addTaskColumnId, setAddTaskColumnId] = useState(null);

  return (
    <div className="board">
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
    </div>
  );
}

export default Board;
