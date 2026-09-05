# API Contract

The single source of truth for what the API actually does — front-end work
against this table, not against reading the server's source code. Every
row below was verified against the current server code (Mongoose/MongoDB
persistence, board ownership + invitation model).

_Response shape convention: all error responses are
`{ error: { message, code, requestId, details? } }`._

_All object ids (`id`, `boardId`, `columnId`, `assigneeId`, etc.) are
MongoDB ObjectId strings._

## Auth

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| POST | `/api/auth/register` | Create an account | No | `{ name, email, password }` (password ≥ 8 chars) | `201 { token, user: { id, name, email } }` | `400` weak password/missing fields, `409` email already registered |
| POST | `/api/auth/login` | Log in | No | `{ email, password }` | `200 { token, user }` | `401` wrong email or password (same error either way — never reveals which) |
| GET | `/api/auth/me` | Get the current user | Yes | — | `200 { id, name, email }` | `401` no/invalid/expired token |

_Token: JWT, 7-day expiry, sent as `Authorization: Bearer <token>`. Never
returns `passwordHash` in any response._

## Boards

A board has exactly one **owner** and any number of **members**. Only the
owner can create/edit tasks on it, edit or delete the board, and invite or
remove members. `GET /api/boards` and every other board endpoint only
ever consider boards the requester owns or belongs to — a board you have
no access to behaves as if it doesn't exist (`403`/`404` as noted below).

| Method | Path | Purpose | Auth required | Who | Request body | Success | Error cases |
|--------|------|---------|:--------------:|-----|---------------|---------|-------------|
| GET | `/api/health` | Liveness check (not a board endpoint, listed here since it's the simplest one) | No | — | — | `200 { status: "ok", uptime, db }` | — |
| GET | `/api/boards` | List boards you own or belong to | Yes | Any member/owner | — | `200 [ ...boards ]` | `401` if no/invalid token |
| GET | `/api/boards/:id` | Get one board | Yes | Member/owner | — | `200 { ...board }` | `403` not a member, `404` id doesn't exist |
| GET | `/api/boards/:id/stats` | Per-assignee task/overdue counts for one board | Yes | Member/owner | — | `200 [ { assigneeId, assignee, taskCount, overdueCount } ]` | `403` not a member, `404` id doesn't exist |
| POST | `/api/boards` | Create a board (you become the owner) | Yes | Any authenticated user | `{ name, description? }` | `201 { ...board }` | `400` if name missing |
| PATCH | `/api/boards/:id` | Update a board's name/description/columns | Yes | Owner only | any subset of board fields | `200 { ...board }` | `400` invalid fields, `403` not the owner, `404` missing id |
| DELETE | `/api/boards/:id` | Delete a board | Yes | Owner only | — | `204` (no body) | `403` not the owner, `404` id doesn't exist |
| GET | `/api/boards/:id/members` | List members, owner first | Yes | Member/owner | — | `200 [ { id, name, email, role: "owner" \| "member" } ]` | `403` not a member, `404` missing board |
| POST | `/api/boards/:id/members` | Send a pending invite to join this board | Yes | Owner only | `{ email }` | `201 { ...invitation }` (still **pending** — see Invitations below) | `400` invalid email, `403` not the owner, `404` board or that email doesn't exist, `409` already a member / already has a pending invite |
| DELETE | `/api/boards/:id/members/:userId` | Remove an existing member | Yes | Owner only | — | `200 [ ...members ]` (updated list) | `403` not the owner, or target is the owner (can't remove yourself this way), `404` missing board |
| GET | `/api/boards/:id/invitations` | List this board's pending (not-yet-accepted) invites | Yes | Owner only | — | `200 [ { id, invitedUserId, invitedUserName, invitedUserEmail, status: "pending" } ]` | `403` not the owner, `404` missing board |

_Board `columns` default to `[To Do, Doing, Done]` at creation and aren't
independently CRUD'd yet — they come along with `PATCH /api/boards/:id`
if you replace the whole `columns` array._

## Tasks

Only the board owner can create, edit, reassign, or delete a task. A
non-owner who is the task's assignee may only change its `columnId`
(moving it between statuses) — attempting to change anything else is
rejected with `403`, even if the request body also happens to include
unchanged copies of other fields (the offline-sync client always PATCHes
the whole task doc; the server only objects to fields whose *value*
actually differs from what's stored).

| Method | Path | Purpose | Auth required | Who | Request body | Success | Error cases |
|--------|------|---------|:--------------:|-----|---------------|---------|-------------|
| GET | `/api/tasks` | List tasks on boards you belong to | Yes | Any member/owner | — | `200 [ ...tasks ]` | `401` if no/invalid token |
| GET | `/api/tasks/:id` | Get one task | Yes | Any authenticated user* | — | `200 { ...task }` | `404` if id doesn't exist |
| POST | `/api/tasks` | Create a task | Yes | Board owner only | `{ title, assigneeId, boardId, columnId, dueDate?, description? }` | `201 { ...task }` | `400` missing/invalid fields, `403` not the board's owner, `404` boardId doesn't reference a real board, or assigneeId isn't a real user, `403` assigneeId isn't a member of that board |
| PATCH | `/api/tasks/:id` | Update a task | Yes | Owner: any field. Assignee: `columnId` only. | any subset of task fields **plus required `version`** (optimistic concurrency) | `200 { ...task }` | `400` invalid fields/missing version, `403` not owner and not assignee, or assignee tried to change a restricted field, `404` missing task/board, `409` version conflict — task was edited by someone else, reload and retry |
| DELETE | `/api/tasks/:id` | Delete a task | Yes | Board owner only | — | `204` (no body) | `403` not the owner, `404` if id doesn't exist |

_*`GET /api/tasks/:id` doesn't currently check board membership — see
Known gaps in `backend/README.md`._

_Every task belongs to a real board via `boardId`, validated at creation.
`assigneeId` must reference a real user who is either the board's owner or
one of its members — the server resolves it into both `assigneeId` (the
ref, used for permission checks) and `assignee` (a cached display name,
used by the stats aggregation and card UI) on every create/reassign._

## Invitations

An invite is created via `POST /api/boards/:id/members` (owner-only, see
Boards above) but lives and is responded to through this resource — this
is what backs the notification bell in the UI.

| Method | Path | Purpose | Auth required | Who | Request body | Success | Error cases |
|--------|------|---------|:--------------:|-----|---------------|---------|-------------|
| GET | `/api/invitations` | List pending invites addressed to me | Yes | The invited user | — | `200 [ { id, boardId, boardName, invitedById, invitedByName, status: "pending" } ]` | `401` if no/invalid token |
| POST | `/api/invitations/:id/respond` | Accept or decline an invite | Yes | The invited user only | `{ action: "accept" \| "decline" }` | `200 { ...invitation }` (now `status: "accepted"` or `"declined"`; accepting also adds you to the board's members) | `400` invalid action, `403` this invite isn't addressed to you, `404` missing invitation, `409` already responded to |

_A person can have at most one **pending** invite per board at a time —
sending a second one while the first is still pending is rejected with
`409` (see `POST /api/boards/:id/members` above)._

## Users

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/users` | List every registered user | Yes | — | `200 [ { id, name, email } ]` | `401` if no/invalid token |
| GET | `/api/users?q=<text>` | Search users by name or email (case-insensitive, capped at 8 results, excludes yourself) | Yes | — | `200 [ { id, name, email } ]` | `401` if no/invalid token |

_Read-only on purpose — users are created via `POST /api/auth/register`,
not through this resource. Never returns `passwordHash`. The `q` search
powers the Team page's "search someone to invite" box._

## Activity

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/activity` | Recent activity feed (task created/moved/deleted) | Yes | — | `200 [ ...activity ]` | `401` if no/invalid token |
| GET | `/api/activity?boardId=<id>&limit=<n>` | Feed scoped to one board, capped at `limit` entries | Yes | — | `200 [ ...activity ]` | `401` if no/invalid token |

_Entries are only ever created internally (from `taskService`), never
posted directly by a client — there's no `POST` on this resource._

## Testing status

- [x] Every endpoint above tested directly (curl) for both success and
      failure cases during development
- [x] The Postman collection (`Postman/Flowty.postman_collection.json`)
      covers every endpoint above — 54 requests across 8 folders
      (Health, Auth, Boards, Board Members & Invitations, Tasks, Users,
      Activity, Cleanup), chained via collection variables so a full
      top-to-bottom run exercises the real invite→accept and
      owner-vs-assignee permission flows against a live server, not just
      isolated calls
- [x] Route protection confirmed: every route above except
      register/login correctly rejects requests with no/invalid token
- [x] Permission checks confirmed: non-owner task edits, non-owner
      board mutations, and responding to someone else's invitation all
      correctly return `403`
