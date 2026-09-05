# Flowty

A kanban-style task board with real board ownership, member invitations,
and permissioned tasks. Full-stack: React client + Express API + MongoDB.

## Structure

```
frontend/   React + Vite client (see frontend/README.md)
backend/    Express API (see backend/README.md)
docs/       API_CONTRACT.md, DECISIONS.md
Postman/    Flowty.postman_collection.json — every endpoint, success + failure cases
```

## Running both

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

Then open `http://localhost:5173` and register a new account at `/signup` —
there's no seeded login; every account and board is created for real
through the API.

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

## API

Full request/response contract, including every error case:
`docs/API_CONTRACT.md`.
Importable Postman collection: `Postman/Flowty.postman_collection.json`.

| Resource | Base path | Auth required |
|---|---|:---:|
| Auth | `/api/auth/*` | Only `/me` |
| Tasks | `/api/tasks` | Yes |
| Boards | `/api/boards` (+ `/members`, `/invitations`, `/stats`) | Yes |
| Invitations | `/api/invitations` | Yes |
| Users | `/api/users` (supports `?q=` search) | Yes |
| Activity | `/api/activity` | Yes |

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
- [ ] Automated tests + CI
- [ ] Real-time sync (the notification bell currently polls, not push),
      Docker, deployment
