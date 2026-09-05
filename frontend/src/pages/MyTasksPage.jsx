// MyTasksPage.jsx
import { Link } from "react-router-dom";
import { useTasks } from "../context/TasksContext";
import { useBoards } from "../context/BoardsContext";
import { useAuth } from "../context/AuthContext";
import { columnTitle } from "../utils/columns";

function MyTasksPage() {
  const tasks = useTasks();
  const { boards } = useBoards();
  const { user } = useAuth();
  // Task assignees are still plain name strings (from the pre-auth mock
  // data days), matched against the real logged-in user's name. This
  // breaks if two people share a name — fine for now, worth revisiting
  // once tasks are assigned by user id instead of name.
  const myTasks = tasks.filter((task) => task.assignee === user?.name);

  // "My Tasks" spans every board, and each board can have differently
  // named columns — group by the column's actual title text (looked up
  // per task's own board) rather than a fixed 3-status list.
  const grouped = new Map();
  for (const task of myTasks) {
    const board = boards.find((b) => b.id === task.boardId);
    const title = columnTitle(board, task.columnId);
    if (!grouped.has(title)) grouped.set(title, []);
    grouped.get(title).push(task);
  }

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
          {[...grouped.entries()].map(([title, tasksForColumn]) => (
            <div className="mytasks-group" key={title}>
              <h2 className="mytasks-group__title">
                {title} <span className="mytasks-group__count">{tasksForColumn.length}</span>
              </h2>
              <div className="mytasks-list">
                {tasksForColumn.map((task) => (
                  <Link to={`/tasks/${task.id}`} key={task.id} className="mytasks-row">
                    <span
                      className={`mytasks-row__status mytasks-row__status--${title.toLowerCase().replace(" ", "-")}`}
                    />
                    <span className="mytasks-row__title">{task.title}</span>
                    <span className="mytasks-row__due">{task.dueDate}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyTasksPage;
