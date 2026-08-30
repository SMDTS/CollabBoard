# CollabBoard

A Trello-style kanban board built with React, Vite, and React Router — multiple boards, drag-and-drop cards, a command palette, light/dark themes, and a real (if mock-data-backed) feature set behind every page.

## Getting started

**Requirements:** Node.js 18+ and npm

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Other scripts

```bash
npm run build     # production build, output to dist/
npm run preview   # preview the production build locally
npm run lint       # ESLint
```

## Features

- **Boards** — a landing grid of boards; open one to see its kanban columns
- **Drag-and-drop** — drag a card between To Do / Doing / Done; state is lifted
  into `TasksContext`, so the move is real, not just visual
- **Task detail panel** — click a card to edit it in a slide-in panel
  (title, status, due date, delete) instead of navigating away
- **Command palette** — `Ctrl+K` / `⌘K` from anywhere, or click the search bar
  in the top bar, to jump to a page or a task by title
- **Dashboard** — live stats (computed from real task state, not hardcoded),
  a board list, and a recent-activity feed
- **My Tasks** — tasks assigned to the current (mock) user, grouped by status
- **Team** — member directory with search, online/away/offline status, and a
  workload progress bar computed from real task data
- **Settings** — account form, **light/dark theme toggle** (persisted to
  `localStorage`), language/region fields, a keyboard shortcuts reference,
  and a danger zone with a **working data export** (downloads a real JSON
  file) and a two-step account deletion confirmation
- **Toast notifications** for actions that aren't wired to a backend yet,
  instead of silently doing nothing
- **Collapsible sidebar**, with Settings pinned to the bottom
- **Login / Signup** — fully designed static pages (not placeholders);
  real auth is a future milestone, see Known Limitations below

## Project structure

```
src/
├── main.jsx                # Router + context provider setup
├── App.jsx                  # Routes, app shell, command palette state
├── App.css                   # All styles for the app shell (not auth pages)
├── context/
│   ├── ThemeContext.jsx        # Light/dark theme, persisted to localStorage
│   ├── TasksContext.jsx        # Live task state — add/move/update/delete
│   └── ToastContext.jsx        # Toast notification queue
├── data/
│   ├── mockBoards.js            # Seed data for the boards list
│   ├── mockTasks.js             # Seed data for tasks (shared across boards — see below)
│   └── mockTeam.js              # Seed data for the Team page
├── components/
│   ├── Sidebar.jsx, TopBar.jsx    # App shell chrome
│   ├── Board.jsx, Column.jsx,     # Kanban board pieces
│   │   TaskCard.jsx
│   ├── TaskDetailPanel.jsx        # Slide-in task editor
│   └── CommandPalette.jsx         # Ctrl+K search overlay
├── pages/                          # One component per route
├── styles/
│   └── auth.css                     # Login/Signup styles — see note below
└── assets/
    ├── auth/                          # Login/Signup images
    └── dashboard/                      # (currently unused — see below)
```

## Design system

Colors live entirely in CSS variables defined in `App.css`'s `:root` (light
theme) and `[data-theme="dark"]` (dark theme) blocks — no component hardcodes
a hex value for anything that should adapt between themes. Key tokens:

| Token | Purpose |
|---|---|
| `--cb-bg` | Page background |
| `--cb-surface` | Default card/panel background |
| `--cb-card-bg` | Task card background specifically (warm cream, not white) |
| `--cb-text`, `--cb-text-secondary`, `--cb-text-muted` | Text hierarchy |
| `--cb-iris`, `--cb-iris-deep` | Primary buttons/active states (dark charcoal) |
| `--cb-violet`, `--cb-sky`, `--cb-success` | Status/accent colors (To Do, Doing, Done) |
| `--cb-link` | Text links |
| `--cb-todo-tint`, `--cb-doing-tint`, `--cb-done-tint` | Per-column background tints |

These values were sampled directly from the rendered Login page, not assumed
from variable names — if you're adding a new color, check `App.css`'s `:root`
first rather than picking a new hex value.

**`src/styles/auth.css`** is separate on purpose — it's Login/Signup's own
self-contained stylesheet and should stay untouched by app-shell theme
changes.

## Adding a new page

Every page's root element uses the shared `.page-shell` class (defined in
`App.css`), which handles full-bleed layout and consistent title/subtitle
styling. Copy the pattern from an existing page (e.g. `TeamPage.jsx`) rather
than building a new page container from scratch.

## Known limitations

- **All boards share the same task list.** `mockTasks.js` isn't scoped per
  board yet — this is flagged with `// TODO ` comments wherever it
  matters. Real per-board data needs the database milestone.
- **No real authentication.** Login/Signup are fully designed but submitting
  just fakes success. The current user is hardcoded (`Dinith`) in a few
  places, each marked `// TODO `.
- **"New board" and "Invite member"** show a toast explaining what's
  missing (the database, and auth, respectively) rather than doing nothing —
  they're intentionally not wired up yet.
- **`src/assets/dashboard/dashboard-bg.jpg`** is no longer imported anywhere
  (an earlier Dashboard design used it as a background image); safe to
  delete if you want to trim the repo, kept for now in case it's wanted again.

## Contributing notes

- Task/board state lives in `TasksContext` via plain `useState` — don't add
  local state for task data in a component; add an action to the context
  instead.
- The Command Palette's open/closed state is controlled from `App.jsx`, not
  managed internally — this is what lets both the `Ctrl+K` shortcut and the
  TopBar's search button open the same instance.
- Card/column/task colors are all theme-variable-driven — never hardcode a
  hex value for something that appears on both light and dark mode.