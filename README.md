# Flowty

A kanban-style task board. Full-stack: React client + Express API.

**Assignment 02 — Working REST APIs (with mock data) Integrated with Frontend.**
The backend is a real Express REST API — routes, controllers, services, and
repositories, four resources (auth, tasks, boards, users), JWT-protected —
but still backed by in-memory data rather than a database. Real persistence
(MongoDB) is Assignment 03.

## Structure

```
frontend/   React + Vite client (see frontend/README.md)
backend/    Express API (see backend/README.md)
docs/       API_CONTRACT.md, DECISIONS.md
postman/    Flowty.postman_collection.json — every endpoint, success + failure cases
```

## Running both

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # fill in JWT_SECRET with any random string
npm install
npm run dev             # http://localhost:4000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev              # http://localhost:5173
```

Then open `http://localhost:5173` and register a new account at `/signup` —
there's no seeded login; every account is created for real through the API.

## API

Full request/response contract, including every error case: `docs/API_CONTRACT.md`.
Importable Postman collection covering all 26 requests: `postman/Flowty.postman_collection.json`.

| Resource | Base path | Auth required |
|---|---|:---:|
| Auth | `/api/auth/*` | Only `/me` |
| Tasks | `/api/tasks` | Yes |
| Boards | `/api/boards` | Yes |
| Users | `/api/users` | Yes |

## Status

- [x] Front-end: all 10 pages built (Assignment 01)
- [x] Backend: Express API scaffolded and layered (routes/controllers/services/repositories)
- [x] Auth: register, login, JWT, protected `/me`
- [x] Tasks and Boards: full CRUD, validated, protected
- [x] Tasks linked to boards via `boardId` — each board shows only its own tasks
- [x] Users: read-only endpoint backing the Team page
- [x] Front-end fully wired to the real API — no mock data files remain
- [x] Postman collection + API contract documented
- [ ] MongoDB persistence (Assignment 03)
- [ ] Automated tests + CI (Assignment 04)
- [ ] Real-time sync, Docker, deployment (Assignment 05)