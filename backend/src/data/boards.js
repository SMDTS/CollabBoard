
export const boards = [
  { id: 1, name: "Product Launch", description: "Website redesign, launch checklist, and go-live tasks." },
  { id: 2, name: "Mobile App Sprint", description: "iOS/Android sprint work — bugs, features, and polish." },
  { id: 3, name: "Marketing Site", description: "Content, SEO, and campaign landing pages." },
];

export let nextBoardId = 4;
export function bumpBoardId() {
  return nextBoardId++;
}
