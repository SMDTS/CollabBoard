# Flowty (client)

The React front end for Flowty, a kanban-style task board with board
ownership, member invitations, and permissioned tasks. Built with Vite,
React Router, and a real Express + MongoDB API behind it — see
`../backend/README.md` and the root `../README.md` for the full picture.

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
- **Boards, with real ownership** — the person who creates a board is its
  owner. Only the owner can create/assign tasks, invite or remove
  members, and edit or delete the board itself. Everyone else can only
  drag their own assigned cards between columns.
- **Invitations, not direct adds** — the owner invites someone (by email,
  or by searching the Team page); the invite sits pending until the
  invited person accepts or declines it from the notification bell.
- **Notification bell** — polls for pending invitations and lets you
  Accept/Decline right from the dropdown, no page navigation required.
- **Task creation via a modal** — title, description, status, assignee,
  and a due date + time, all in one place, opened from any column's
  "Add a card" button. Replaces the old inline single-field quick-add.
- **Custom date/time picker** — a calendar grid + time field with
  Today/Tomorrow/Clear shortcuts, rendered through a portal so it can
  never get clipped by the modal it opens from, and flips above the
  trigger automatically if there isn't room below.
- **Drag-and-drop** — drag a card between columns; the move is persisted
  to the server with optimistic UI. Cards you're not allowed to move
  (not the owner, not the assignee) simply aren't draggable.
- **Task detail** — a slide-in quick-edit panel from the board, plus a
  full page (`/tasks/:id`). Editable fields are gated the same way as the
  API: full edit for the board owner, move-only for the assignee.
- **Command palette** — `Ctrl+K` / `⌘K`, or the search bar in the top bar,
  to jump to a page or a task by title.
- **Dashboard** — live stats computed from real task/board data, plus an
  interactive animated background.
- **My Tasks** — tasks assigned to whoever is actually logged in
  (matched by user id, not name), grouped by status.
- **Team** — pick a board, see who's actually on it (owner tagged), and
  — if you're the owner — search the whole user directory by name or
  email to invite someone new, or remove an existing member.
- **Settings** — account form, light/dark theme toggle (persisted), a
  working data export (downloads real JSON from the API), and a two-step
  account deletion flow.
- **Offline-first task sync** — tasks live in a local PouchDB store first
  and sync to the server in the background, with conflict detection if
  the server version moved on since your last edit.
- **Collapsible sidebar**, with Settings pinned to the bottom.

## Project structure

```
src/
├── main.jsx                 # Theme/Toast/Auth providers + router setup
├── App.jsx                   # Routes, auth route guard, provider mounting order
├── App.css                    # All styles for the app shell (not auth pages)
├── api/
│   ├── client.js                 # fetch wrapper — adds the auth token, throws real errors on failure
│   ├── auth.js, tasks.js,        # One file per backend resource
│   │   boards.js, users.js,
│   │   invitations.js
├── context/
│   ├── AuthContext.jsx          # Logged-in user + token, persisted to localStorage
│   ├── TasksContext.jsx         # Live task state — add/move/update/delete via the offline-first sync layer
│   ├── BoardsContext.jsx        # Live board state, scoped server-side to boards you own or belong to
│   ├── InvitationsContext.jsx   # Polls pending invitations; powers the TopBar notification bell
│   ├── UsersContext.jsx         # Read-only — the registered users list (used by Settings' export)
│   └── ThemeContext.jsx, ToastContext.jsx
├── components/
│   ├── Sidebar.jsx, TopBar.jsx     # App shell chrome (TopBar owns the notification dropdown)
│   ├── Board.jsx, Column.jsx,      # Kanban board pieces — Board owns the create-task modal's open state
│   │   TaskCard.jsx
│   ├── CreateTaskModal.jsx         # Title/description/status/assignee/due-date modal for new tasks
│   ├── DateTimePicker.jsx          # Custom calendar + time popover used inside the modal
│   ├── TaskDetailPanel.jsx         # Slide-in task editor, permission-gated per field
│   ├── CommandPalette.jsx          # Ctrl+K search overlay
│   └── BubbleBackground.jsx        # Dashboard's animated background
├── pages/                           # One component per route (TeamPage is board-scoped, see below)
├── db/
│   ├── pouchdb.js                    # Local task store + doc<->task shape conversion
│   └── tasksSync.js                  # Push/pull sync loop, conflict handling
├── utils/
│   ├── avatarColor.js                # One shared function — same person, same avatar color everywhere
│   └── columns.js                    # Reads a board's columns consistently across pages
├── styles/
│   └── auth.css                       # Login/Signup's own stylesheet — kept separate on purpose
└── assets/
    └── auth/                            # Login/Signup images
```

**No mock data files remain.** Every page reads through the contexts
above, which call the real API.

## Permission model (frontend mirrors the backend)

The UI never assumes what the API will allow — it computes the same
`isOwner` / `isAssignee` checks the backend enforces, so buttons and
inputs are disabled/hidden in exactly the situations where the request
would otherwise fail:

- `isOwner = board.ownerId === currentUser.id`
- A task's `assigneeId` (not the display-name `assignee` field) is what's
  compared against the logged-in user for "can I move this card".
- `Column`'s "Add a card" button, `TaskDetailPanel`'s and
  `TaskDetailPage`'s field editing, and `TaskCard`'s `draggable` attribute
  all gate on these two checks, computed once in `BoardPage`/`Board` and
  passed down as props rather than recomputed per component.

If you add a new mutation, check whether it needs the same gating —
the backend will reject it either way, but hiding/disabling the control
up front avoids a confusing "click it and get an error toast" experience.

## Design system

Colors live entirely in CSS variables in `App.css`'s `:root` (light theme)
and `[data-theme="dark"]` (dark theme) blocks — nothing hardcodes a hex
value for anything that should adapt between themes. Key tokens:

| Token | Purpose |
|---|---|
| `--cb-bg` | Page background |
| `--cb-surface` | Default card/panel/modal background |
| `--cb-card-bg` | Task card / form-field background specifically (warm cream, not white) |
| `--cb-text`, `--cb-text-secondary`, `--cb-text-muted` | Text hierarchy |
| `--cb-iris`, `--cb-iris-deep` | Primary buttons/active states |
| `--cb-violet`, `--cb-sky`, `--cb-success` | Status/accent colors (To Do, Doing, Done); also the modal/picker's primary action color |
| `--cb-link` | Text links |
| `--cb-danger` | Destructive actions (kick member, decline invite) |
| `--cb-todo-tint`, `--cb-doing-tint`, `--cb-done-tint` | Per-column background tints |
| `--cb-hover-tint` | Subtle hover background, reused across menus/popovers/quick-action chips |

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

- **The notification bell polls, it doesn't push.** `InvitationsContext`
  re-fetches every 20 seconds — a new invite can take up to that long to
  show up, there's no websocket layer yet.
- **`src/assets/dashboard/dashboard-bg.jpg`** is no longer imported
  anywhere (an earlier Dashboard design used it); safe to delete.
- **Due date/time is still a free-text field on the backend.** The
  `DateTimePicker` writes a fixed `"YYYY-MM-DDTHH:mm"` shape, but nothing
  stops older data (or a direct API call) from storing an arbitrary
  string — the stats aggregation's overdue calculation best-effort parses
  it and silently treats anything it can't parse as "no due date".

## Contributing notes

- Task/board/user/invitation state lives in their respective contexts —
  don't add local component state for that data; add an action to the
  context instead, the same way `TasksContext` exposes
  `addTask`/`moveTask`/etc.
- `TasksProvider`, `BoardsProvider`, `UsersProvider`, and
  `InvitationsProvider` are mounted inside `App.jsx`'s authenticated
  branch, not in `main.jsx` — they call protected endpoints, so they
  should only fetch once a user is actually logged in. Don't move them
  back to `main.jsx`. `InvitationsProvider` is nested inside
  `BoardsProvider` specifically because accepting an invite needs to
  trigger `BoardsContext`'s `reload()`.
- The Command Palette's open/closed state is controlled from `App.jsx`,
  not managed internally — this is what lets both the `Ctrl+K` shortcut
  and the TopBar's search button open the same instance.
- `Board.jsx` owns the create-task modal's open state (which column it
  was opened from), not `Column.jsx` — that's what lets the modal offer
  every column as a "Status" choice instead of just the one whose "+"
  was clicked.
- Card/column/task colors are theme-variable-driven — never hardcode a
  hex value for something that appears on both light and dark mode.
- Avatar colors go through `src/utils/avatarColor.js` — don't add another
  per-component name-to-color map.
- Any popover/dropdown that can appear inside a scrollable container
  (like a modal) should follow `DateTimePicker`'s pattern — portal it to
  `document.body`, position it with `getBoundingClientRect()` against a
  `position: fixed` box, and re-measure on resize/scroll — rather than a
  plain `position: absolute` child, which gets clipped by any ancestor
  with `overflow`.