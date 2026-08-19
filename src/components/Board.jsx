// Board.jsx
import mockTasks from "../data/mockTasks";
import Column from "./Column";
import TaskCard from "./TaskCard";

const STATUSES = ["To Do", "Doing", "Done"];

function Board() {
  return (
    <div className="board">
      {STATUSES.map((status) => {
        const tasksForStatus = mockTasks.filter((task) => task.status === status);

        return (
          <Column key={status} title={status}>
            {tasksForStatus.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                assignee={task.assignee}
                dueDate={task.dueDate}
                status={task.status}
              />
            ))}
          </Column>
        );
      })}
    </div>
  );
}

export default Board;
