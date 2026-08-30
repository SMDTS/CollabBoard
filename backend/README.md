# Flowty Server

The REST API for Flowty, built with Node.js and Express. Four resources —
auth, tasks, boards, users — all layered (routes → controllers → services
→ repositories) and JWT-protected. Data lives in in-memory arrays under
`src/data/`; MongoDB is a later milestone, not this one.

## Getting started

```bash
cp .env.example .env    # fill in JWT_SECRET with any random string
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

## Endpoints

Full request/response contract, including every error case, is in
`../docs/API_CONTRACT.md`. A ready-to-import Postman collection covering
every endpoint (success and failure cases) is in `../postman/`.

| Resource | Base path | Auth required |
|---|---|:---:|
| Auth | `/api/auth/register`, `/login`, `/me` | Only `/me` |
| Tasks | `/api/tasks` | Yes |
| Boards | `/api/boards` | Yes |
| Users | `/api/users` | Yes (read-only) |

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
  routes/         taskRoutes.js, authRoutes.js, boardRoutes.js, userRoutes.js
                  — maps method + path to a controller function. No logic.
  controllers/    HTTP in, HTTP out. Reads req, calls a service, sends res.
                  Never contains business rules.
  services/       The business rules. Never touches req or res. taskService
                  validates a task's boardId references a real board;
                  authService hashes passwords and issues JWTs; etc.
  repositories/   Data access. In-memory arrays today; swapped for MongoDB
                  queries later without the layers above needing to change.
  middleware/     authenticate (JWT verification), validate (zod), error
                  handling, request logging/id.
  schemas/        zod schemas describing valid request shapes per resource.
  data/           Temporary in-memory arrays standing in for a database.
                  Deleted once a real database replaces them.
  utils/          AppError and its subclasses (NotFoundError, ConflictError,
                  UnauthorizedError, ValidationError), jwt.js, catchAsync.js.
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
- **Creating a task validates `boardId` against real boards**, throwing a
  `404` rather than silently creating an orphaned task nothing can find.
- **`/api/users` is read-only.** Users are created via
  `POST /api/auth/register`, not through this resource.

## Status

- [x] Project scaffolded, `/api/health` responding
- [x] Task routes: full CRUD, validated, protected
- [x] Auth: register, login, JWT, protected `/me`
- [x] Boards: full CRUD, validated, protected
- [x] Users: read-only endpoint
- [x] Tasks linked to boards via `boardId`, validated on creation
- [x] Every route (except register/login) requires authentication
- [x] Postman collection covering every endpoint, including failure cases
- [ ] MongoDB persistence — next milestone
- [ ] Automated tests + CI
- [ ] Real-time sync (Socket.io), Docker, deployment