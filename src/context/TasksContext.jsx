// TasksContext.jsx
// Lifts task state out of the static mockTasks import so drag-and-drop can
// actually mutate status, and so any component (Board, MyTasks, the command
// palette, the detail panel) reads/writes the same live list.
import { createContext, useContext, useState } from "react";
import initialTasks from "../data/mockTasks";

const TasksStateContext = createContext(null);
const TasksActionsContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks);

  const moveTask = (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const updateTask = (taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  };

  return (
    <TasksStateContext.Provider value={tasks}>
      <TasksActionsContext.Provider value={{ moveTask, deleteTask, updateTask }}>
        {children}
      </TasksActionsContext.Provider>
    </TasksStateContext.Provider>
  );
}

export function useTasks() {
  return useContext(TasksStateContext);
}

export function useTasksActions() {
  return useContext(TasksActionsContext);
}