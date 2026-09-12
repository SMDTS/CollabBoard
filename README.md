# Flowty

A real-time, offline-first kanban board — board ownership and membership,
permissioned tasks, live collaboration, and a working conflict-resolution
story for when two people edit the same card while one of them is offline.
Full-stack: React client + Express API + MongoDB, with Socket.IO for
real-time sync.

This isn't a CRUD demo with real-time bolted on. The core design
constraint from day one was: tasks have to work offline, sync back up
cleanly, and now also update live for everyone else on the same board —
and those three things have to cooperate, not fight each other. How that
actually works is in "Core concepts" below and `docs/DECISIONS.md`.

## What it does

- **Boards** with exactly one owner and any number of invited members.
  The owner creates/edits/assigns tasks and manages membership; members
  can only move the cards assigned to them between columns.
- **Invitations**, not direct adds — a board owner invites by email or by
  searching the Team page; the invited person sees a notification and has
  to accept before they're actually on the board.
- **Offline-first tasks** — every task write lands in a local PouchDB
  store first and syncs to the server in the background, with real
  conflict detection (not "last write wins") if the server version moved
  on since your last edit.
- **Real-time sync** — task create/move/delete shows up live for everyone
  else looking at the same board, with a presence indicator for who's
  currently online, over a Socket.IO connection layered on top of the
  offline store rather than replacing it.
- **Everything else you'd expect**: JWT auth, forgot-password email flow,
  avatar upload, an activity feed, a weekly summary email job, and a full
  Postman collection covering every endpoint's success *and* failure
  cases.

## Architecture

Express and Socket.IO share **one** HTTP server (`backend/src/server.js`),
not two separate ports. Every task mutation still goes through the REST
API and its full permission + optimistic-concurrency checks exactly once;
Socket.IO only broadcasts the result to everyone else already looking at
that board. Full diagram with Cloudinary/SMTP/CI included, plus the full
dependency list and what we deliberately didn't use: `docs/TECH_STACK.md`.
Why it's built this specific way: `docs/DECISIONS.md`. Full real-time
event contract: `docs/SOCKET_EVENTS.md`.

## Tech stack

**Frontend:** React 19, Vite, React Router, PouchDB (offline store),
Socket.IO client, Framer Motion.
**Backend:** Express, Mongoose/MongoDB, Socket.IO, JWT auth, zod
validation, Cloudinary (avatars), Nodemailer (optional email).
**Infra:** Docker + Docker Compose (local), nginx (local reverse proxy),
MongoDB Atlas + Render (production), GitHub Actions (CI), Jest/Supertest
+ Vitest/RTL (tests).

Full breakdown of every package and — just as deliberately — what we
chose *not* to use and why (Redux, GraphQL, TypeScript, Kubernetes,
Redis, microservices): `docs/TECH_STACK.md`.

## Project structure

```
frontend/   React + Vite client (see frontend/README.md)
backend/    Express API (see backend/README.md)
docs/       API_CONTRACT.md, SOCKET_EVENTS.md, DECISIONS.md,
            DEPLOYMENT.md, TECH_STACK.md
Postman/    Flowty.postman_collection.json — every endpoint, success + failure cases
render.yaml Render Blueprint (production deploy config)
docker-compose.yml, backend/Dockerfile, frontend/Dockerfile + nginx.conf
```

## Getting started

### Option A — run both locally

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in JWT_SECRET (any random string) and MONGODB_URI
npm install
npm run dev              # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev               # http://localhost:5173
```

Then open `http://localhost:5173` and register a new account at `/signup`
— there's no seeded login; every account and board is created for real
through the API.

### Option B — Docker (no local Node/MongoDB needed)

```bash
cp .env.example .env   # optional — sets JWT_SECRET; falls back to a
                        # placeholder if skipped, fine for a quick local run
docker compose up --build
```

Open `http://localhost:8080`. The API is also reachable directly at
`http://localhost:4000` (for Postman/curl). `docker compose down -v` tears
the whole stack down, including the Mongo volume.

The client container talks to the API through nginx (`frontend/nginx.conf`)
rather than directly — same origin, no CORS to configure, and the exact
proxy shape a real deployment behind a reverse proxy would need anyway.
That proxy config has two rules, not one: `/api/*` for REST, and a
separate `/socket.io/*` rule carrying the WebSocket `Upgrade` headers —
easy to forget, and the one thing most likely to make real-time silently
stop working in a container without erroring anywhere obvious.

### Option C — the real deployed version

Render (backend as a Docker web service, frontend as a static site) +
MongoDB Atlas, both free tier. Full setup walkthrough (Atlas cluster,
Render Blueprint, env vars): `docs/DEPLOYMENT.md`. Actual config:
`render.yaml` at the repo root.

## Core concepts

- **Boards have exactly one owner and any number of members.** The owner
  creates and assigns tasks, edits the board, and manages membership.
  Members can only move the cards assigned to them between columns —
  they can't create, edit, reassign, or delete tasks.
- **Joining a board goes through an invitation, not a direct add.** A
  board owner sends an invite by email (or by searching the Team page);
  the invited person sees it as a notification (the bell icon in the top
  bar) and has to Accept before they're actually added to the board.
- **Every board/task list is scoped to the logged-in user.** `GET
  /api/boards` and `GET /api/tasks` only ever return boards/tasks the
  user owns or is a member of — never the whole database.
- **Tasks are offline-first, not just "works offline as a fallback."**
  Every write lands in a local PouchDB store first; a background sync
  loop pushes it to the API and flags a real conflict (not last-write-wins)
  if the server version moved on first.
- **Task changes are real-time on top of that, not instead of it.**
  Create, move, or delete a task and everyone else currently viewing that
  board sees it immediately — a Socket.IO event merges into the same
  local PouchDB store the offline sync already uses, so the UI has one
  update path, not two competing ones. See `docs/SOCKET_EVENTS.md` for
  the event contract, and the "● N online" indicator on a board's header
  for presence.

## API

Full request/response contract, including every error case:
`docs/API_CONTRACT.md`.
Real-time (Socket.IO) event contract: `docs/SOCKET_EVENTS.md`.
Importable Postman collection: `Postman/Flowty.postman_collection.json`
(REST only — Postman doesn't exercise the socket layer, see
`docs/SOCKET_EVENTS.md` for how to test that by hand).

| Resource | Base path | Auth required |
|---|---|:---:|
| Auth | `/api/auth/*` | Only `/me` |
| Tasks | `/api/tasks` | Yes |
| Boards | `/api/boards` (+ `/members`, `/invitations`, `/stats`) | Yes |
| Invitations | `/api/invitations` | Yes |
| Users | `/api/users` (supports `?q=` search) | Yes |
| Activity | `/api/activity` | Yes |

## Testing

```bash
cd backend && npm test    # Jest + Supertest, real in-memory MongoDB
cd frontend && npm test   # Vitest + React Testing Library
```

Both run automatically on every push/PR via GitHub Actions
(`.github/workflows/ci.yml`, Node 22). The socket layer specifically has
its own integration test (`backend/tests/sockets.test.js`) that spins up
a real Socket.IO server rather than mocking it — see `docs/SOCKET_EVENTS.md`'s
"Testing status" section for exactly what it covers.

## Status

- [x] Front-end: all pages built, wired to the real API — no mock data remains
- [x] Backend: Express API layered (routes/controllers/services/repositories)
- [x] MongoDB persistence (Mongoose) for users, boards, tasks, invitations
- [x] Auth: register, login, JWT, protected `/me`
- [x] Board ownership + membership model, with owner-only task
      creation/editing and assignee-only card moves enforced server-side
- [x] Invitation flow: send → pending → notification → accept/decline
- [x] Team page: board-scoped member list, search-to-invite by name/email
- [x] Task creation via a modal (title, description, status, assignee,
      due date + time) with a custom calendar/time picker
- [x] Offline-first task sync (PouchDB) with conflict detection
- [x] Postman collection covering every endpoint, including permission
      and failure cases (see `Postman/` above)
- [x] Automated tests + CI (Jest/Supertest on the backend, Vitest/RTL on
      the frontend — GitHub Actions runs both on every push/PR)
- [x] Real-time task sync (Socket.IO): live create/move/delete across
      everyone viewing a board, plus a presence indicator. Covered by an
      automated integration test (`backend/tests/sockets.test.js`) and
      confirmed manually — two accounts, one board, watched a card move
      live in the other window with the socket connection visible in
      DevTools as a `101 Switching Protocols` upgrade. The invitation
      bell still polls — see `docs/SOCKET_EVENTS.md`'s "Not implemented"
      section for why that's a deliberate scope cut, not a gap
- [x] Docker: `docker compose up --build` runs the whole stack (Mongo +
      API + nginx-served client) from a clean clone — confirmed working,
      including real-time through the container setup specifically (not
      just standalone). See "Getting started" above.
- [ ] Deployment (public URL) — config is written and ready
      (`render.yaml`, `docs/DEPLOYMENT.md`); going live is the one
      remaining step.

## Docs index

| Doc | Covers |
|---|---|
| `docs/API_CONTRACT.md` | Every REST endpoint, request/response shapes, every error case |
| `docs/SOCKET_EVENTS.md` | Real-time event contract, presence, reconnection behavior, testing status |
| `docs/DECISIONS.md` | Why things are built the way they are, in the order they were decided |
| `docs/DEPLOYMENT.md` | Atlas + Render setup, step by step |
| `docs/TECH_STACK.md` | Every dependency and what it's for, plus what we deliberately didn't use |
| `backend/README.md` | Backend-specific structure, design decisions, known gaps |
| `frontend/README.md` | Frontend-specific structure, design decisions, known limitations |