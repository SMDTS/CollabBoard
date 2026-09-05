# Flowty Server

The REST API for Flowty, built with Node.js, Express, and MongoDB
(Mongoose). Six resources — auth, tasks, boards, invitations, users,
activity — all layered (routes → controllers → services → repositories)
and JWT-protected.

## Getting started

```bash
cp .env.example .env    # fill in JWT_SECRET (any random string) and MONGODB_URI
npm install
npm run dev
```

Check it's alive:

```bash
curl http://localhost:4000/api/health
```

There's no seeded login — register a real account first:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"atleast8chars"}'
```

Then create a board (the response's `Authorization` token from register/login
goes in every subsequent request):

```bash
curl -X POST http://localhost:4000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"My Board"}'
```

Whoever creates a board is its **owner** automatically — there's no
separate "make me the owner" step.

### Seeding example boards

`src/scripts/seedBoards.js` creates a few example boards, owned by
whichever user you specify:

```bash
SEED_OWNER_EMAIL=you@example.com node src/scripts/seedBoards.js
```

Boards now require an owner, so this script needs at least one registered
user to exist first (it falls back to the earliest-registered user if
`SEED_OWNER_EMAIL` is omitted, and exits with an error if there are none).

## Endpoints

Full request/response contract, including every error case, is in
`../docs/API_CONTRACT.md`. A ready-to-import Postman collection is in
`../Postman/`.

| Resource | Base path | Auth required |
|---|---|:---:|
| Auth | `/api/auth/register`, `/login`, `/me` | Only `/me` |
| Tasks | `/api/tasks` | Yes |
| Boards | `/api/boards` | Yes |
| Board members | `/api/boards/:id/members` | Yes (owner-only to invite/kick) |
| Board invitations | `/api/boards/:id/invitations` | Yes (owner-only) |
| Invitations (mine) | `/api/invitations` | Yes |
| Users | `/api/users` (supports `?q=name-or-email` search) | Yes |
| Activity | `/api/activity` | Yes |

Every protected route requires `Authorization: Bearer <token>` — the token
comes from a successful `/register` or `/login` response.

## Folder structure

```
src/
  server.js       Starts the process. Only calls app.listen(). Nothing else.
  app.js          Builds the Express app and the middleware chain, exports
                  it without starting it — lets tests import the app
                  directly later without needing a real port.
  config.js       Reads and validates environment variables once, at
                  startup, and exports a single config object.
  routes/         taskRoutes.js, authRoutes.js, boardRoutes.js,
                  invitationRoutes.js, userRoutes.js, activityRoutes.js
                  — maps method + path to a controller function. No logic.
  controllers/    HTTP in, HTTP out. Reads req, calls a service, sends res.
                  Never contains business rules.
  services/       The business rules — including every permission check
                  (board ownership, membership, who can move/edit a task,
                  who can respond to which invitation). Never touches req
                  or res.
  repositories/   Data access via Mongoose. One file per model, same
                  function names regardless of what queries change
                  underneath, so the layers above never need to change.
  models/         Mongoose schemas: User, Board, Task, Invitation, Activity.
  middleware/     authenticate (JWT verification), validate (zod), error
                  handling, request logging/id.
  schemas/        zod schemas describing valid request shapes per resource.
  scripts/        seedBoards.js — one-off scripts, not part of the running app.
  utils/          AppError and its subclasses (NotFoundError, ForbiddenError,
                  ConflictError, UnauthorizedError, ValidationError),
                  jwt.js, catchAsync.js.
```

## Why server.js and app.js are separate

`app.js` exports a fully configured Express app that has **not** started
listening. That means:
- Tests can import `app` directly with no port needed
- Multiple test files can run in parallel with zero port collisions
- `server.js` is the only file that ever calls `app.listen()`

## Notable design decisions

- **Every error response has one shape**:
  `{ error: { message, code, requestId, details? } }` — the front end's
  `apiFetch` wrapper relies on this being consistent across every endpoint.
- **Login/register return the same 401 message either way** (unknown
  email vs. wrong password) — never reveals which one was wrong.
- **Creating a task validates `boardId` against a real board**, throwing a
  `404` rather than silently creating an orphaned task nothing can find.
- **Board membership gates everything.** `GET /api/boards` and
  `GET /api/tasks` only ever return what the requesting user owns or
  belongs to — this is enforced in the repository query itself
  (`findAllForUser`), not filtered after the fact.
- **Only the owner creates, assigns, edits, or deletes tasks.** A
  non-owner assignee may only change a task's `columnId` (moving it
  between statuses) — every other field is rejected with `403`, even
  though the offline-sync client always PATCHes the whole task doc (see
  `taskService.updateTask`'s `valuesDiffer` check, which only objects to
  fields whose *value* actually changed, not merely present-but-unchanged
  fields).
- **Joining a board is two steps, not one.** `POST /api/boards/:id/members`
  creates a *pending* `Invitation`, not an immediate membership — the
  invited user has to `POST /api/invitations/:id/respond` with
  `{ action: "accept" }` before `boardRepository.addMember` ever runs.
  This is what backs the notification bell in the UI.
- **`assigneeId` is the source of truth; `assignee` is a display cache.**
  Tasks store both — `assigneeId` (a real `User` ref) for permission
  checks and `MyTasksPage` filtering, `assignee` (a name string) so the
  stats aggregation and card UI don't need an extra lookup per task.
  They're kept in sync any time a task is created or reassigned.
- **`/api/users` doubles as a directory search.** `GET /api/users?q=...`
  matches name or email case-insensitively (capped at 8 results) — this
  is what powers the Team page's "search someone to invite" box. With no
  `q`, it falls back to the original "list everyone" behavior other pages
  still use.

## Known gaps

- **`/api/activity` isn't board-scoped by membership yet.** It accepts an
  optional `?boardId=` filter, but doesn't check the requester actually
  belongs to that board before returning its activity — worth tightening
  alongside the rest of the permission model above.
- **No automated tests yet.**

## Status

- [x] Project scaffolded, `/api/health` responding
- [x] MongoDB persistence (Mongoose) — no more in-memory arrays
- [x] Auth: register, login, JWT, protected `/me`
- [x] Boards: full CRUD, validated, protected, owner-only mutations
- [x] Board membership: owner/members model, invite → accept/decline flow
- [x] Tasks: full CRUD, validated, protected, owner-only create/edit,
      assignee-only column moves
- [x] Tasks linked to boards via `boardId`, validated on creation
- [x] Users: read + `?q=` search
- [x] Invitations: send, list mine, accept/decline
- [x] Postman collection covering every endpoint — auth, boards, board
      members/invitations, tasks (owner + assignee permission cases),
      users (including `?q=` search), and activity — 54 requests across
      8 folders, including failure cases (400/401/403/404/409) for each
- [ ] Automated tests + CI
- [ ] Real-time sync (Socket.io) — notifications currently poll
- [ ] Docker, deployment