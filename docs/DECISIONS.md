# Design Decisions

Short log of non-obvious choices and why, so the reasoning isn't lost.

## Repo structure

Monorepo (`frontend/` + `backend/` in one repo) rather than two separate
repos. Chosen so the M1 tag and future milestone tags all live on one
timeline, and so a PR can touch both sides of an API change together.

## API collection tool

**Postman**, per instructor requirement (the assignment brief names it
specifically). Bruno was considered — its per-request text files are
genuinely better for git diffs across a multi-branch team — but Postman
was the safer choice given the brief's exact wording.

## Auth token storage

**localStorage**, via `frontend/src/api/client.js`. This is a real
downloadable web app (not a sandboxed environment with restrictions on
browser storage), so localStorage is the standard, correct choice — the
token persists across page refreshes and browser restarts until the user
explicitly logs out or it expires (7 days, set in `backend/src/utils/jwt.js`).

## Task–board relationship

Tasks reference their board via a required `boardId` field, validated
against real boards at creation time (`404` if the board doesn't exist).
Boards do **not** carry a `taskCount` field — that's computed client-side
from the tasks list, to avoid a count that could drift out of sync with
reality.

## Provider mounting order (frontend)

`TasksProvider`, `BoardsProvider`, and `UsersProvider` are mounted inside
`App.jsx`'s authenticated route branch, not unconditionally in `main.jsx`.
They call protected endpoints — mounting them before login was confirmed
caused failed requests and error toasts to appear on the login screen
itself. See the front-end README's "Contributing notes" for the same
warning inline in the code.