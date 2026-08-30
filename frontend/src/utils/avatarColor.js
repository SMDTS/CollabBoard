
const COLOR_CYCLE = ["var(--cb-violet)", "var(--cb-sky)", "var(--cb-success)"];

export function avatarColor(name) {
  if (!name) return "var(--cb-text-muted)";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % COLOR_CYCLE.length;
  }
  return COLOR_CYCLE[hash];
}
