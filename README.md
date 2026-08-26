# Flowty

A kanban-style task board. Full-stack: React client + Express API.

## Structure

```
frontend/   React + Vite client (see frontend/README.md)
backend/    Express API (see backend/README.md)
docs/       API contract + design decisions
```

## Running both

```bash
# Terminal 1
cd backend
cp .env.example .env   # fill in JWT_SECRET
npm install
npm run dev             # http://localhost:4000

# Terminal 2
cd frontend
npm install
npm run dev              # http://localhost:5173
```

## Status

- [x] Front-end: all pages built (Assignment 01)
- [x] Backend: project scaffolded, `/api/health` responding
- [ ] Task routes wired end-to-end (Lab 1)
- [ ] Auth (Lab 3)
- [ ] Front-end switched from mock data to the real API
