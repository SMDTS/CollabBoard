# API Contract

The single source of truth for what the API actually does — front-end work
against this table, not against reading the server's source code.

Update this as each endpoint is built (Lab 1 onward).

| Method | Path | Purpose | Auth required | Request body | Success | Error cases |
|--------|------|---------|:--------------:|---------------|---------|-------------|
| GET | `/api/health` | Liveness check | No | — | `200 { status: "ok", uptime }` | — |
| GET | `/api/tasks` | List tasks | TBD (Lab 3) | — | `200 [ ...tasks ]` | — |
| POST | `/api/tasks` | Create a task | TBD | `{ title, status, assignee, dueDate }` | `201 { ...task }` | `400` validation |
| PATCH | `/api/tasks/:id` | Update a task | TBD | partial task fields | `200 { ...task }` | `400`, `404` |
| DELETE | `/api/tasks/:id` | Delete a task | TBD | — | `204` | `404` |

_Response shape convention: all error responses are
`{ error: { message, code, requestId, details? } }`._
