// MyTasksPage.jsx
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useAuth } from "../context/AuthContext";

const STATUSES = ["To Do", "Doing", "Done"];

function MyTasksPage() {
  const tasks = useTasks();
  const { user } = useAuth();
  // Task assignees are still plain name strings (from the pre-auth mock
  // data days), matched against the real logged-in user's name. This
  // breaks if two people share a name — fine for now, worth revisiting
  // once tasks are assigned by user id instead of name.
  const myTasks = tasks.filter((task) => task.assignee === user?.name);

  return (
    <div className="page-shell">
      <h1 className="page-shell__title">My Tasks</h1>
      <p className="page-shell__subtitle">
        Tasks assigned to <strong>{user?.name}</strong>.
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
