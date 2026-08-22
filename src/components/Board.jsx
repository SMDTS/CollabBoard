// Board.jsx
import { useTasks } from "../context/TasksContext";
import Column from "./Column";
import TaskCard from "./TaskCard";

const STATUSES = ["To Do", "Doing", "Done"];

function Board({ onOpenTask }) {
  const tasks = useTasks();

  return (
    <div className="board">
      {STATUSES.map((status) => {
        const tasksForStatus = tasks.filter((task) => task.status === status);

        return (
          <Column key={status} title={status}>
            {tasksForStatus.map((task) => (
              <TaskCard
                key={task.id}
                id={task.id}
                title={task.title}
                assignee={task.assignee}
                dueDate={task.dueDate}
                status={task.status}
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