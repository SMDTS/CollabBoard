import { createContext, useContext, useState, useRef } from "react";
import initialTasks from "../data/mockTasks";

const TasksStateContext = createContext(null);
const TasksActionsContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(initialTasks);

  const nextId = useRef(Math.max(...initialTasks.map((t) => t.id), 0) + 1);

  const addTask = (status, title, assignee = "Sarah") => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newTask = {
      id: nextId.current++,
      title: trimmed,
      assignee,
      status,
      dueDate: "No date",
    };
    setTasks((prev) => [...prev, newTask]);
  };

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
      <TasksActionsContext.Provider value={{ addTask, moveTask, deleteTask, updateTask }}>
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