export const tasks = [
  { id: 1, title: "Set up project repository", assignee: "Dinith", status: "To Do", dueDate: "Aug 12" },
  { id: 2, title: "Draft onboarding wireframes", assignee: "Tehan", status: "To Do", dueDate: "Aug 14" },
  { id: 3, title: "Write API spec for tasks endpoint", assignee: "Dasun", status: "To Do", dueDate: "Aug 15" },
  { id: 4, title: "Build TaskCard component", assignee: "Dinith", status: "Doing", dueDate: "Aug 9" },
  { id: 5, title: "Implement column filtering logic", assignee: "Tehan", status: "Doing", dueDate: "Aug 10" },
  { id: 6, title: "Style board layout with flexbox", assignee: "Dasun", status: "Doing", dueDate: "Aug 11" },
  { id: 7, title: "Scaffold Vite project", assignee: "Dinith", status: "Done", dueDate: "Aug 5" },
  { id: 8, title: "Install dependencies", assignee: "Tehan", status: "Done", dueDate: "Aug 5" },
  { id: 9, title: "Confirm dev server runs", assignee: "Dasun", status: "Done", dueDate: "Aug 6" },
];

export let nextId = 10;
export function bumpId() {
  return nextId++;
}