# Flowty (client)

The React front end for Flowty, a kanban-style task board. Built with Vite,
React Router, and a real Express API behind it — see `../backend/README.md`
and the root `../README.md` for the full picture.

## Getting started

**Requirements:** Node.js 18+ and npm. The backend must be running too —
see the root README for running both together.

```bash
cp .env.example .env   # VITE_API_URL, defaults to http://localhost:4000
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). There's no
seeded login — register a real account at `/signup` to get started.

### Other scripts

```bash
npm run build     # production build, output to dist/
npm run preview   # preview the production build locally
npm run lint       # ESLint
```

## Features

- **Real authentication** — register, log in, log out (which actually
  clears the session, not just navigates away). Unauthenticated visitors
  are redirected to `/login` automatically.
- **Boards** — a landing grid of real boards from the API; open one to see
  its kanban columns. Each board shows only its own tasks.
- **Drag-and-drop** — drag a card between To Do / Doing / Done; the move is
  persisted to the server with optimistic UI (instant visual update, rolled
  back with an error toast if the request actually fails).
- **Task detail** — a slide-in quick-edit panel from the board, plus a full
  page (`/tasks/:id`) with a description field and assignee reassignment.
- **Command palette** — `Ctrl+K` / `⌘K`, or the search bar in the top bar,
  to jump to a page or a task by title.
- **Dashboard** — live stats computed from real task/board data, plus an
  interactive animated background.
- **My Tasks** — tasks assigned to whoever is actually logged in, grouped
  by status.
- **Team** — real registered users, with search, and a workload progress
  bar computed from real task data.
- **Settings** — account form, light/dark theme toggle (persisted), a
  working data export (downloads real JSON from the API), and a two-step
  account deletion flow.
- **Toast notifications** for actions that aren't wired to a backend
  feature yet (e.g. inviting a teammate), instead of silently doing nothing.
- **Collapsible sidebar**, with Settings pinned to the bottom.

## Project structure

```
src/
├── main.jsx                 # Theme/Toast/Auth providers + router setup
├── App.jsx                   # Routes, auth route guard, command palette state
├── App.css                    # All styles for the app shell (not auth pages)
├── api/
│   ├── client.js                 # fetch wrapper — adds the auth token, throws real errors on failure
│   ├── auth.js, tasks.js,        # One file per backend resource
│   │   boards.js, users.js
├── context/
│   ├── AuthContext.jsx          # Logged-in user + token, persisted to localStorage
│   ├── TasksContext.jsx         # Live task state — add/move/update/delete via the real API
│   ├── BoardsContext.jsx        # Live board state
│   ├── UsersContext.jsx         # Read-only — the registered users list
│   └── ThemeContext.jsx, ToastContext.jsx
├── components/
│   ├── Sidebar.jsx, TopBar.jsx     # App shell chrome
│   ├── Board.jsx, Column.jsx,      # Kanban board pieces
│   │   TaskCard.jsx
│   ├── TaskDetailPanel.jsx         # Slide-in task editor
│   ├── CommandPalette.jsx          # Ctrl+K search overlay
│   └── BubbleBackground.jsx        # Dashboard's animated background
├── pages/                           # One component per route
├── utils/
│   └── avatarColor.js                # One shared function — same person, same avatar color everywhere
├── styles/
│   └── auth.css                       # Login/Signup's own stylesheet — kept separate on purpose
└── assets/
    └── auth/                            # Login/Signup images
```

**No mock data files remain.** `mockTasks.js`, `mockBoards.js`, and
`mockTeam.js` are all deleted — every page reads through the contexts
above, which call the real API.

## Design system

Colors live entirely in CSS variables in `App.css`'s `:root` (light theme)
and `[data-theme="dark"]` (dark theme) blocks — nothing hardcodes a hex
value for anything that should adapt between themes. Key tokens:

| Token | Purpose |
|---|---|
| `--cb-bg` | Page background |
| `--cb-surface` | Default card/panel background |
| `--cb-card-bg` | Task card background specifically (warm cream, not white) |
| `--cb-text`, `--cb-text-secondary`, `--cb-text-muted` | Text hierarchy |
| `--cb-iris`, `--cb-iris-deep` | Primary buttons/active states |
| `--cb-violet`, `--cb-sky`, `--cb-success` | Status/accent colors (To Do, Doing, Done) |
| `--cb-link` | Text links |
| `--cb-todo-tint`, `--cb-doing-tint`, `--cb-done-tint` | Per-column background tints |

These values were sampled directly from the rendered Login page, not
assumed from variable names — check `App.css`'s `:root` before picking a
new hex value for anything new.

`src/styles/auth.css` is separate on purpose — Login/Signup's own
self-contained stylesheet, untouched by app-shell theme changes.

## Adding a new page

Every page's root element uses the shared `.page-shell` class (in
`App.css`), which handles full-bleed layout and consistent title/subtitle
styling. Copy the pattern from an existing page rather than building a new
page container from scratch.

## Known limitations

- **"Invite member" and account deletion are not fully real yet.** Invite
  shows an explanatory toast (needs an email/invite-token system that
  doesn't exist). Account deletion clears the local session but doesn't
  yet call a real `DELETE /api/users/me` — that endpoint doesn't exist on
  the backend yet.
- **Assignee matching is by name, not id.** Tasks store `assignee` as a
  plain name string matched against the logged-in user's name — this
  breaks if two people share a name. Worth revisiting once tasks reference
  a user id instead.
- **`src/assets/dashboard/dashboard-bg.jpg`** is no longer imported
  anywhere (an earlier Dashboard design used it); safe to delete.
- **No persistence.** All data lives in the backend's in-memory arrays and
  is lost on server restart — MongoDB is a later milestone.

## Contributing notes

- Task/board/user state lives in their respective contexts — don't add
  local component state for that data; add an action to the context
  instead, the same way `TasksContext` exposes `addTask`/`moveTask`/etc.
- The Command Palette's open/closed state is controlled from `App.jsx`,
  not managed internally — this is what lets both the `Ctrl+K` shortcut
  and the TopBar's search button open the same instance.
- `TasksProvider`, `BoardsProvider`, and `UsersProvider` are mounted inside
  `App.jsx`'s authenticated branch, not in `main.jsx` — they call
  protected endpoints, so they should only fetch once a user is actually
  logged in. Don't move them back to `main.jsx`.
- Card/column/task colors are theme-variable-driven — never hardcode a hex
  value for something that appears on both light and dark mode.
- Avatar colors go through `src/utils/avatarColor.js` — don't add another
  per-component name-to-color map.