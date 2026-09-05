// Board.jsx
import { useTasks } from "../context/TasksContext";
import { getColumns } from "../utils/columns";
import Column from "./Column";
import TaskCard from "./TaskCard";

function Board({ board, onOpenTask }) {
  const tasks = useTasks();
  const columns = getColumns(board);

  return (
    <div className="board">
      {columns.map((column) => {
        const tasksForColumn = tasks.filter(
          (task) => task.boardId === board.id && task.columnId === column.id
        );

        return (
          <Column key={column.id} columnId={column.id} title={column.title} boardId={board.id}>
            {tasksForColumn.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                assignee={task.assignee}
                dueDate={task.dueDate}
                columnTitle={column.title}
                onOpen={onOpenTask}
              />
            ))}
          </Column>
        );
      })}
    </div>
  );
}

export default Board;
