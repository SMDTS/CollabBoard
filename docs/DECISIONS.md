# Design Decisions

Short log of non-obvious choices and why, so the reasoning isn't lost.

## Repo structure

Monorepo (`frontend/` + `backend/` in one repo) rather than two separate
repos. Chosen so the M1 tag and future milestone tags all live on one
timeline, and so a PR can touch both sides of an API change together.

## API collection tool

**Postman**, per instructor requirement (the assignment brief names it
specifically). Bruno was considered — its per-request text files are
genuinely better for git diffs across a multi-branch team — but Postman
was the safer choice given the brief's exact wording.

## Auth token storage

**localStorage**, via `frontend/src/api/client.js`. This is a real
downloadable web app (not a sandboxed environment with restrictions on
browser storage), so localStorage is the standard, correct choice — the
token persists across page refreshes and browser restarts until the user
explicitly logs out or it expires (7 days, set in `backend/src/utils/jwt.js`).

## Task–board relationship

Tasks reference their board via a required `boardId` field, validated
against real boards at creation time (`404` if the board doesn't exist).
Every task also requires an `assigneeId` that must be that board's owner
or one of its members (`403` otherwise) — you can't assign a task to
someone who doesn't have access to the board it lives on. Boards do
**not** carry a `taskCount` field — that's computed client-side from the
tasks list, to avoid a count that could drift out of sync with reality.

## Provider mounting order (frontend)

`TasksProvider`, `BoardsProvider`, `UsersProvider`, and
`InvitationsProvider` are mounted inside `App.jsx`'s authenticated route
branch, not unconditionally in `main.jsx`. They call protected endpoints —
mounting them before login was confirmed caused failed requests and error
toasts to appear on the login screen itself. See the front-end README's
"Contributing notes" for the same warning inline in the code.
`InvitationsProvider` is nested inside `BoardsProvider` specifically:
accepting an invite adds a new board to the user's list, so the
invitations context needs a handle on `BoardsContext`'s `reload()`.

## Board membership model

Considered adding a `role` field directly on a flat `members` array
(`{ user, role: "owner" | "editor" | "viewer" }`) versus a single `owner`
ref plus a plain `members` array. Went with the latter: this app only
ever needed two permission levels (the person who can manage the board,
and everyone else who can only move their own cards), and a single
`owner` field makes "is this person allowed to delete the board" a
one-line comparison instead of a array-scan-and-check-role. If a third
tier (e.g. "editor") becomes a real requirement, the `members` array is
the natural place to grow a `role` field without touching `owner`.

## Invitations instead of direct membership adds

`POST /api/boards/:id/members` used to add the given email straight to
`board.members` — no consent step. Changed to create a pending
`Invitation` instead, because silently adding someone to a board (and by
extension, exposing them to that board's tasks) without their agreement
is the kind of thing that looks fine in a demo and bad in practice.  The
tradeoff: joining a board now takes two API round trips (send invite,
accept invite) instead of one, and the UI needs a place to surface
pending invites — solved with a polling `InvitationsContext` and the
TopBar's notification bell, rather than adding a websocket layer just
for this.

## Notifications: polling, not push

The invitation bell polls `GET /api/invitations` every 20 seconds instead
of using Socket.io/SSE. A real-time push layer is still a listed
milestone (see both READMEs' Status sections) — for now, polling is a
small, dependency-free way to get "invites show up without a manual
refresh" without pulling in a whole real-time layer for a single feature.
Revisit this once activity feeds or task updates also need push, since
at that point a shared websocket connection pays for itself.

## assigneeId vs. assignee

Tasks store both an `assigneeId` (a real `User` ref) and an `assignee`
(a plain display-name string). `assigneeId` is what every permission
check (`taskService`) and `MyTasksPage`'s filtering use — it's reliable
even if two people share a name. `assignee` exists purely so the stats
aggregation (`taskRepository.getStatsByBoardId`) and the board/card UI
don't need an extra per-task user lookup just to render a name. The two
are kept in sync at write time (`resolveAssignee` in `taskService`)
rather than computed on read, trading a small amount of duplicated data
for not needing a join on every board render.

## Task creation: a modal, not an inline row

The original inline "type a title, press Enter" quick-add row in each
column was replaced with a single shared `CreateTaskModal`, opened from
any column's "+" button. Reasons: it needed to grow more fields (status,
assignee, description, due date/time) than an inline row could hold
without becoming cramped, and centralizing it in `Board.jsx` (rather than
duplicating the form once per `Column`) means the modal can offer every
column as a status choice instead of just the one it was opened from.

## Custom date/time picker over the native input

`<input type="datetime-local">` was the first pass, but its rendering is
inconsistent across browsers and it doesn't fit the app's visual design.
Replaced with a custom `DateTimePicker`: a calendar grid + time field
rendered through a React portal into `document.body`, positioned with
`getBoundingClientRect()` against a `position: fixed` box rather than
relying on normal document flow. This was necessary, not just cosmetic —
a plain absolutely-positioned popover nested inside the modal was getting
clipped by the modal's `overflow-y: auto` body. The portal approach also
lets it flip above its trigger and cap its own height with internal
scrolling when there isn't room below, which a CSS-only popover
couldn't do without knowing the viewport ahead of time.