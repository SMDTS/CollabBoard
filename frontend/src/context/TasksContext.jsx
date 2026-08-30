import { createContext, useContext, useState, useEffect } from "react";
import * as tasksApi from "../api/tasks.js";
import { useToast } from "./ToastContext.jsx";

const TasksStateContext = createContext(null);
const TasksActionsContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const showToast = useToast();

  useEffect(() => {
    tasksApi
      .fetchTasks()
      .then(setTasks)
      .catch((err) => showToast(err.message || "Couldn't load tasks", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTask = async (status, title, boardId, assignee = "Sarah") => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const newTask = await tasksApi.createTask({ title: trimmed, assignee, status, boardId });
      setTasks((prev) => [...prev, newTask]);
    } catch (err) {
      showToast(err.message || "Couldn't create the task", "error");
    }
  };

  const moveTask = async (taskId, newStatus) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await tasksApi.updateTask(taskId, { status: newStatus });
    } catch (err) {
      setTasks(previous);
      showToast(err.message || "Couldn't move the task", "error");
    }
  };

  const deleteTask = async (taskId) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await tasksApi.deleteTask(taskId);
    } catch (err) {
      setTasks(previous);
      showToast(err.message || "Couldn't delete the task", "error");
    }
  };

  const updateTask = async (taskId, patch) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
    try {
      await tasksApi.updateTask(taskId, patch);
    } catch (err) {
      setTasks(previous);
      showToast(err.message || "Couldn't update the task", "error");
    }
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
