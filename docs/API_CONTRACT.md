# API Contract

The single source of truth for what the API actually does — front-end work
against this table, not against reading the server's source code. Every
row below was verified against a running server, not assumed from the code.

_Response shape convention: all error responses are
`{ error: { message, code, requestId, details? } }`._

## Auth

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| POST | `/api/auth/register` | Create an account | No | `{ name, email, password }` | `201 { token, user: { id, name, email } }` | `400` weak password/missing fields, `409` email already registered |
| POST | `/api/auth/login` | Log in | No | `{ email, password }` | `200 { token, user }` | `401` wrong email or password (same error either way — never reveals which) |
| GET | `/api/auth/me` | Get the current user | Yes | — | `200 { id, name, email }` | `401` no/invalid/expired token |

_Token: JWT, 7-day expiry, sent as `Authorization: Bearer <token>`. Never
returns `passwordHash` in any response._

## Tasks

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/health` | Liveness check (not really a task endpoint, listed here since it's the simplest one) | No | — | `200 { status: "ok", uptime }` | — |
| GET | `/api/tasks` | List all tasks | Yes | — | `200 [ ...tasks ]` | `401` if no/invalid token |
| GET | `/api/tasks/:id` | Get one task | Yes | — | `200 { ...task }` | `404` if id doesn't exist |
| POST | `/api/tasks` | Create a task | Yes | `{ title, assignee, boardId, status?, dueDate?, description? }` | `201 { ...task }` | `400` if title/assignee/boardId missing, `404` if boardId doesn't reference a real board |
| PATCH | `/api/tasks/:id` | Update a task | Yes | any subset of task fields | `200 { ...task }` | `400` invalid fields, `404` missing id |
| DELETE | `/api/tasks/:id` | Delete a task | Yes | — | `204` (no body) | `404` if id doesn't exist |

_Every task belongs to a real board via `boardId` — creating a task with an
unknown `boardId` is rejected with `404`, not silently accepted. Seed data:
all 9 example tasks are on board 1; boards 2 and 3 start empty._

## Boards

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/boards` | List all boards | Yes | — | `200 [ ...boards ]` | `401` if no/invalid token |
| GET | `/api/boards/:id` | Get one board | Yes | — | `200 { ...board }` | `404` if id doesn't exist |
| POST | `/api/boards` | Create a board | Yes | `{ name, description? }` | `201 { ...board }` | `400` if name missing |
| PATCH | `/api/boards/:id` | Update a board | Yes | any subset of board fields | `200 { ...board }` | `400` invalid fields, `404` missing id |
| DELETE | `/api/boards/:id` | Delete a board | Yes | — | `204` (no body) | `404` if id doesn't exist |

_Boards don't carry a `taskCount` field — tasks reference their board via
`boardId` (see above), so the real count is computed client-side from the
tasks list, not faked on the board object itself._

## Users

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/users` | List every registered user | Yes | — | `200 [ { id, name, email } ]` | `401` if no/invalid token |

_Read-only on purpose — users are created via `POST /api/auth/register`,
not through this resource. Never returns `passwordHash`._

## Testing status

- [x] Every endpoint above tested directly (curl) for both success and
      failure cases during development
- [x] Every endpoint has a corresponding saved request in the Postman
      collection (`postman/Flowty.postman_collection.json`), including
      failure cases — 26 requests total across 5 folders
- [x] Route protection confirmed: every route above except register/login
      correctly rejects requests with no/invalid token