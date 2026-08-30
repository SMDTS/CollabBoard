// src/data/tasks.js
// Temporary in-memory store, standing in for a database until M3. This is
// the ONLY file the repository layer is allowed to touch directly.
export const tasks = [
  { id: 1, title: "Set up project repository", assignee: "Sarah", status: "To Do", dueDate: "Aug 12", boardId: 1 },
  { id: 2, title: "Draft onboarding wireframes", assignee: "Jordan", status: "To Do", dueDate: "Aug 14", boardId: 1 },
  { id: 3, title: "Write API spec for tasks endpoint", assignee: "Priya", status: "To Do", dueDate: "Aug 15", boardId: 1 },
  { id: 4, title: "Build TaskCard component", assignee: "Sarah", status: "Doing", dueDate: "Aug 9", boardId: 1 },
  { id: 5, title: "Implement column filtering logic", assignee: "Jordan", status: "Doing", dueDate: "Aug 10", boardId: 1 },
  { id: 6, title: "Style board layout with flexbox", assignee: "Priya", status: "Doing", dueDate: "Aug 11", boardId: 1 },
  { id: 7, title: "Scaffold Vite project", assignee: "Sarah", status: "Done", dueDate: "Aug 5", boardId: 1 },
  { id: 8, title: "Install dependencies", assignee: "Jordan", status: "Done", dueDate: "Aug 5", boardId: 1 },
  { id: 9, title: "Confirm dev server runs", assignee: "Priya", status: "Done", dueDate: "Aug 6", boardId: 1 },
];

export let nextId = 10;
export function bumpId() {
  return nextId++;
}
