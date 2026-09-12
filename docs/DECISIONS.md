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

The invitation bell polls `GET /api/invitations` every 20 seconds rather
than using Socket.io/SSE. This was written before the real-time milestone,
reasoning that polling was a small, dependency-free way to get "invites
show up without a manual refresh" without pulling in a whole real-time
layer for a single feature — deferring push until something else also
needed it, since at that point a shared websocket connection would pay
for itself.

That "something else" arrived with task sync (see below) — a Socket.IO
connection now exists and is open for the whole session regardless. The
bell still polls anyway: it was a deliberate scope cut for this
milestone, not an oversight. Task events were the higher-value target
against the rubric, and wiring `board:updated`/`member:joined` onto the
same connection the task events already use is a small, well-scoped
follow-up rather than a redesign — see "Not implemented" in
`docs/SOCKET_EVENTS.md`.

## Real-time task sync: Socket.IO, merged through PouchDB

Needed a way for one user's task create/move/delete to show up live for
everyone else looking at the same board, without duplicating the
conflict/permission logic the REST API and offline-sync layer already
enforce correctly.

**Where the events come from.** Rather than moving task mutations onto
socket messages, the REST controllers stay the single place a task is
ever actually written — `taskController.js` emits `task:created` /
`task:updated` / `task:deleted` to the task's board room right after each
one succeeds (`req.app.get("io")`). This means every permission check,
every optimistic-concurrency `version` check, and every activity-log entry
still happens exactly once, in exactly one place; sockets only broadcast
the result.

**Why `actorId` instead of `socket.to()`'s auto-exclude.** The usual
pattern for "don't echo an event back to whoever caused it" is
`socket.to(room).emit(...)` from inside a socket handler, which
automatically skips the sender's own socket. That doesn't apply here — the
mutation arrives over a REST call (`fetch`), not a socket message, so
there's no "sender socket" in scope at emit time. Every event instead
carries `actorId`, and each client compares it against its own logged-in
user id before applying the event, skipping its own actions. Same effect,
just resolved client-side instead of server-side. See
`docs/SOCKET_EVENTS.md` for the full event contract.

**Why events merge into PouchDB instead of updating React state
directly.** The frontend was already offline-first: `TasksContext` reads
from a local PouchDB store, which has its own live `changes` feed, and its
own rule for what's safe to overwrite (never a doc that's `pending` or
`conflict` — those are only resolved through the existing sync/conflict
flow). A remote task event follows that exact same rule
(`applyRemoteTask`/`removeRemoteTask` in `frontend/src/db/tasksSync.js`)
rather than writing a second, parallel notion of "current task state" into
React state. `TasksContext` itself didn't need to change at all — it was
already listening for exactly this kind of update.

**Why presence and rooms are in-memory, not Redis.** The brief scopes this
to one deployed instance; a `Map` of boardId → connected user ids inside
the Node process is correct and simpler for that case. Documented as a
known limitation (`docs/SOCKET_EVENTS.md`) rather than solved preemptively
— the Socket.IO Redis adapter is a drop-in swap if/when a second instance
is ever needed, not a rewrite.

## Deployment: Render (two services) + Atlas, not the Compose shape

`docker-compose.yml` serves the frontend through nginx, same-origin,
proxying to the backend over Docker's internal network — that only works
because Compose puts both containers on one network where they can reach
each other by service name. Two independent Render services don't share
that, so the deployed shape is different on purpose: the frontend as a
Render static site (CDN-served, not a container), talking to the
backend's public URL directly, cross-origin, with CORS and Socket.IO's
`cors.origin` scoped to that exact frontend URL.

This needed zero source changes. `client.js`'s `BASE_URL` and
`SocketContext.jsx`'s socket connection already worked this exact way in
local dev — `localhost:5173` talking to `localhost:4000` is already
cross-origin — the deployed config just points the same mechanism at real
URLs instead of localhost ones. See `docs/DEPLOYMENT.md` for the full
setup and the env-var wiring between the two services.

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