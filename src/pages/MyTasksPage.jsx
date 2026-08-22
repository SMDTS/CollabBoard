// MyTasksPage.jsx
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";

const CURRENT_USER = "Dinith";

const STATUSES = ["To Do", "Doing", "Done"];

function MyTasksPage() {
  const tasks = useTasks();
  const myTasks = tasks.filter((task) => task.assignee === CURRENT_USER);

  return (
    <div className="page-shell">
      <h1 className="page-shell__title">My Tasks</h1>
      <p className="page-shell__subtitle">
        Tasks assigned to <strong>{CURRENT_USER}</strong>.
      </p>

      {myTasks.length === 0 ? (
        <p className="mytasks-empty">No tasks assigned to you right now.</p>
      ) : (
        <div className="mytasks-columns">
          {STATUSES.map((status) => {
            const tasksForStatus = myTasks.filter((t) => t.status === status);
            if (tasksForStatus.length === 0) return null;

            return (
              <div className="mytasks-group" key={status}>
                <h2 className="mytasks-group__title">
                  {status} <span className="mytasks-group__count">{tasksForStatus.length}</span>
                </h2>
                <div className="mytasks-list">
                  {tasksForStatus.map((task) => (
                    <Link to={`/tasks/${task.id}`} key={task.id} className="mytasks-row">
                      <span
                        className={`mytasks-row__status mytasks-row__status--${status.toLowerCase().replace(" ", "-")}`}
                      />
                      <span className="mytasks-row__title">{task.title}</span>
                      <span className="mytasks-row__due">{task.dueDate}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyTasksPage;