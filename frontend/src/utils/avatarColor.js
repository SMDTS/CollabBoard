// src/utils/avatarColor.js
// Deterministic color per name, so a person's avatar is the same color on
// the board, in the task detail assignee picker, and in the board header's
// avatar stack — not three different hardcoded {Sarah: violet} maps that
// only worked for the old fake seed data and disagreed with each other.
const COLOR_CYCLE = ["var(--cb-violet)", "var(--cb-sky)", "var(--cb-success)"];

export function avatarColor(name) {
  if (!name) return "var(--cb-text-muted)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % COLOR_CYCLE.length;
  }
  return COLOR_CYCLE[hash];
}
