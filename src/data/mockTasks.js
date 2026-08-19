// mockTasks.js
// 9 tasks, 3 per status, matching the M1 brief exactly:
// id, title, assignee, status, dueDate.

const mockTasks = [
  { id: 1, title: "Set up project repository", assignee: "Sarah", status: "To Do", dueDate: "Aug 12" },
  { id: 2, title: "Draft onboarding wireframes", assignee: "Jordan", status: "To Do", dueDate: "Aug 14" },
  { id: 3, title: "Write API spec for tasks endpoint", assignee: "Priya", status: "To Do", dueDate: "Aug 15" },

  { id: 4, title: "Build TaskCard component", assignee: "Sarah", status: "Doing", dueDate: "Aug 9" },
  { id: 5, title: "Implement column filtering logic", assignee: "Jordan", status: "Doing", dueDate: "Aug 10" },
  { id: 6, title: "Style board layout with flexbox", assignee: "Priya", status: "Doing", dueDate: "Aug 11" },

  { id: 7, title: "Scaffold Vite project", assignee: "Sarah", status: "Done", dueDate: "Aug 5" },
  { id: 8, title: "Install dependencies", assignee: "Jordan", status: "Done", dueDate: "Aug 5" },
  { id: 9, title: "Confirm dev server runs", assignee: "Priya", status: "Done", dueDate: "Aug 6" },
];

export default mockTasks;
