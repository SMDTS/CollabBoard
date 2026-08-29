import { tasks, bumpId } from "../data/tasks.js";

export function findAll() {
  return tasks;
}

export function findById(id) {
  return tasks.find((t) => t.id === id);
}

export function create({ title, assignee, status, dueDate }) {
  const task = { id: bumpId(), title, assignee, status, dueDate };
  tasks.push(task);
  return task;
}

export function update(id, patch) {
  const task = findById(id);
  if (!task) return null;
  Object.assign(task, patch);
  return task;
}

export function remove(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}