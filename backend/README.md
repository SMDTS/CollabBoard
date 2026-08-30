# Flowty Server

The REST API for Flowty, built with Node.js and Express. This is the M2
milestone: a working API layer the front-end can build against — no
database yet (that's M3), so data lives in in-memory arrays under `src/data/`.

## Getting started

```bash
cp .env.example .env    # then fill in JWT_SECRET with any random string
npm install
npm run dev
```

Check it's alive:

```bash
curl http://localhost:4000/api/health
```

## Folder structure

```
src/
  server.js       Starts the process. Only calls app.listen(). Nothing else.
  app.js          Builds the Express app and the middleware chain, exports
                  it without starting it — this is what lets tests import
                  the app directly later without needing a real port.
  config.js       Reads and validates environment variables once, at
                  startup, and exports a single config object.
  routes/         One router per resource (taskRoutes.js, authRoutes.js).
                  Maps method + path to a controller function. No logic.
  controllers/    HTTP in, HTTP out. Reads req, calls a service, sends res.
                  Never contains business rules.
  services/       The business rules. Never touches req or res — this is
                  what makes services unit-testable and reusable later.
  repositories/   Data access. In-memory arrays today; swapped for MongoDB
                  queries in M3 without the layers above needing to change.
  middleware/     authenticate, validate, error handling, logging.
  schemas/        zod schemas describing valid request shapes per resource.
  data/           Temporary in-memory arrays standing in for a database.
                  Deleted once M3 replaces them with real persistence.
  utils/          Pure helpers (AppError and friends).
```

## Why server.js and app.js are separate

`app.js` exports a fully configured Express app that has **not** started
listening. That means:
- Tests (Session 4, Supertest) can import `app` directly with no port needed
- Multiple test files can run in parallel with zero port collisions
- `server.js` is the only file that ever calls `app.listen()`

## Status

- [x] Project scaffolded, `/api/health` responding
- [ ] Task routes (Lab 1)
- [ ] Full CRUD + validation + layered architecture (Lab 2)
- [ ] Auth: register/login/JWT/ownership (Lab 3)
- [ ] CORS confirmed working against the real Flowty client
