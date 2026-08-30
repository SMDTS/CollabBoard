// src/data/boards.js
// TODO (future milestone): tasks don't have a boardId yet, so there's no
// real per-board task count — that's why boards don't carry a taskCount
// field here. Add boardId to tasks and compute counts for real once that
// link exists, instead of faking a number.
export const boards = [
  { id: 1, name: "Product Launch", description: "Website redesign, launch checklist, and go-live tasks." },
  { id: 2, name: "Mobile App Sprint", description: "iOS/Android sprint work — bugs, features, and polish." },
  { id: 3, name: "Marketing Site", description: "Content, SEO, and campaign landing pages." },
];

export let nextBoardId = 4;
export function bumpBoardId() {
  return nextBoardId++;
}
