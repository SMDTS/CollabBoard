// utils/columns.js
// Small shared helpers so every page/component that needs a board's
// columns (Board, Column, TaskCard, TaskDetailPanel, TaskDetailPage,
// MyTasksPage, DashboardPage, CommandPalette, TaskConflictBanner) reads
// them the same way instead of re-deriving this logic per file.

// Board.columns is an embedded array of { id, title, position }.
export function getColumns(board) {
  if (!board?.columns) return [];
  return [...board.columns].sort((a, b) => a.position - b.position);
}

export function columnTitle(board, columnId) {
  return getColumns(board).find((c) => c.id === columnId)?.title ?? "—";
}
