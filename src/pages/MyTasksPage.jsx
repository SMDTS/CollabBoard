// MyTasksPage.jsx
import { Link } from "react-router-dom";
import mockTasks from "../data/mockTasks";

// TODO (M2 owner): replace with the real logged-in user once auth exists.
// Every board currently shares the same mockTasks set, so this just
// filters that shared list down to one person as a stand-in for "me".
const CURRENT_USER = "Sarah";

const STATUSES = ["To Do", "Doing", "Done"];

function MyTasksPage() {
  const myTasks = mockTasks.filter((task) => task.assignee === CURRENT_USER);

  return (
    <div className="mytasks-page">
      <h1 className="mytasks-page__title">My Tasks</h1>
      <p className="mytasks-page__subtitle">
        Tasks assigned to <strong>{CURRENT_USER}</strong> (placeholder user — real login comes at M2).
      </p>

      {myTasks.length === 0 ? (
        <p className="mytasks-empty">No tasks assigned to you right now.</p>
      ) : (
        STATUSES.map((status) => {
          const tasksForStatus = myTasks.filter((t) => t.status === status);
          if (tasksForStatus.length === 0) return null;

          return (
            <section className="mytasks-group" key={status}>
              <h2 className="mytasks-group__title">
                {status} <span className="mytasks-group__count">{tasksForStatus.length}</span>
              </h2>
              <div className="mytasks-list">
                {tasksForStatus.map((task) => (
                  <Link to={`/tasks/${task.id}`} key={task.id} className="mytasks-row">
                    <span className={`mytasks-row__status mytasks-row__status--${status.toLowerCase().replace(" ", "-")}`} />
                    <span className="mytasks-row__title">{task.title}</span>
                    <span className="mytasks-row__due">{task.dueDate}</span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

export default MyTasksPage;