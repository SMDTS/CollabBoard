# Deployment

Backend and frontend deploy to [Render](https://render.com) as two
separate services, defined in `render.yaml` at the repo root. The
database is [MongoDB Atlas](https://www.mongodb.com/atlas) — not a
container, a real managed cluster, same as any production setup would use.

Both are free: no credit card for Render, Atlas's M0 tier is free
indefinitely (small, but plenty for this project). The one tradeoff worth
knowing: Render's free web services spin down after 15 minutes with no
traffic and take 30-60s to wake back up on the next request. Not broken —
just open the app a couple of minutes before a demo or before a marker is
expected to check it, rather than assuming it's instantly warm.

## 1. MongoDB Atlas

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
   if you don't have one, then create a new **free M0** cluster.
2. **Database Access** (left sidebar) → add a new database user with a
   username/password (not the same as your Atlas account login) — this is
   what goes into `MONGODB_URI` below.
3. **Network Access** → add IP address → **Allow access from anywhere**
   (`0.0.0.0/0`). Render's free tier doesn't have a fixed outbound IP you
   can allowlist instead, so this is the practical option here — normal
   for a project at this stage, worth tightening later if this ever needed
   to be genuinely production-hardened.
4. Once the cluster's up, click **Connect** → **Drivers** → copy the
   connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<username>`/`<password>` with the database user from step 2,
   and add a database name before the `?` — e.g. `.../flowty?retryWrites=...`
   (Mongoose creates the database automatically on first write if it
   doesn't exist yet; it doesn't need to exist beforehand).

Keep this connection string somewhere safe — it's `MONGODB_URI` in step 3
below, and it's a real credential, not something to commit anywhere.

## 2. Render

1. Create a free account at [render.com](https://render.com) if you don't
   have one, connect your GitHub account, and give Render access to this
   repo (or all repos, your call).
2. Render Dashboard → **New** → **Blueprint** → select this repo. Render
   reads `render.yaml` automatically and shows both services
   (`collabboard-api`, `collabboard-client`) it's about to create.
3. Because `JWT_SECRET` and `MONGODB_URI` are marked `sync: false` in
   `render.yaml`, Render prompts for both **during this same creation
   flow** — paste in the Atlas connection string from step 1 for
   `MONGODB_URI`, and any long random string for `JWT_SECRET` (a password
   generator works fine — it just needs to be unguessable, nothing about
   its format matters).
4. Click through to create both services. First deploy takes a few
   minutes — the backend builds its Docker image, the frontend runs
   `npm run build`.

## 3. After the first deploy — check the names matched

**This happened on this exact deployment** — both names got a suffix:
the frontend is live at `https://collabboard-client-p85o.onrender.com`,
the backend at `https://collabboard-api-cn2v.onrender.com`. `render.yaml`
already has these real URLs baked in, so a fresh deploy from this repo
as-is won't hit the problem described below — this section is for
understanding why, and for whenever you or someone else deploys their
*own* copy under different (likely also-suffixed) names.

`render.yaml` hardcodes each service's expected URL into the other's env
vars (`CLIENT_ORIGIN` on the backend, `VITE_API_URL` on the frontend),
because Render assigns URLs from the service `name:` fields
deterministically — `collabboard-api` → `collabboard-api.onrender.com` —
*unless* that name was already taken by someone else, anywhere on Render
(`.onrender.com` names are global, not per-account).

Check both services' actual URLs on their pages in the Render Dashboard.
If either got a suffix appended (e.g. `collabboard-api-a1b2.onrender.com`),
update the *other* service's env var to match the real URL. **The backend
side (`CLIENT_ORIGIN`) takes effect on its own — Render redeploys
automatically when you save an env var.** The frontend side
(`VITE_API_URL`) does **not**: Vite bakes it into the built JavaScript at
build time, not read at runtime, so saving the env var alone changes
nothing until you also go to the client service → **Manual Deploy** →
**Deploy latest commit** to force a real rebuild. Skipping that step is
exactly what happened on this deployment's first attempt — the old bundle
kept calling the old URL for one full deploy cycle before the rebuild was
triggered.

What it actually looks like when this is wrong, confirmed by seeing it
happen: **not** a CORS error — a plain `404 Not Found` on every API call
(login, register, everything), because the unsuffixed name the old bundle
was still calling either doesn't exist or belongs to an unrelated Render
service, so the request never reaches your backend at all. Open DevTools →
Network during a login attempt and check which host the request is
actually going to — that's the fastest way to catch this.

## Why this shape (two separate services, not the Docker Compose setup)

`docker-compose.yml` (for local dev) serves the frontend through nginx,
same-origin, proxying `/api/` and `/socket.io/` to the backend container
internally. That trick relies on both containers being reachable from
each other by service name (`server`, `client`) on one Docker network —
which only exists because Compose creates that network. Two independent
Render services don't share a network like that, so the same-origin nginx
proxy approach doesn't carry over directly.

Render's own recommended pattern for a Vite/React + API app is what
`render.yaml` does instead: the frontend as a **static site** (served
from Render's CDN, not a container at all — faster, and one less thing to
run), talking to the backend's public URL directly, with the backend's
CORS and Socket.IO `cors.origin` scoped to that exact frontend origin.
This needed zero code changes — `frontend/src/api/client.js`'s `BASE_URL`
and `frontend/src/context/SocketContext.jsx`'s socket connection already
work exactly this way in local dev (`localhost:5173` → `localhost:4000`
is the same cross-origin shape), this just points them at real URLs
instead of localhost ones.

The `frontend/Dockerfile` + `nginx.conf` combo still matters — it's what
`docker-compose.yml` uses locally, and what you'd reach for if a future
deployment target didn't offer static-site hosting and needed the whole
stack containerized instead.

## Environment variables reference

| Var | Where | Value |
|---|---|---|
| `MONGODB_URI` | Render, backend | Atlas connection string (step 1) |
| `JWT_SECRET` | Render, backend | Any long random string |
| `CLIENT_ORIGIN` | Render, backend | The frontend's Render URL — set in `render.yaml`, double check after first deploy |
| `VITE_API_URL` | Render, frontend (build-time) | The backend's Render URL — set in `render.yaml`, double check after first deploy |
| `PORT` | Render, backend | Don't set this — Render assigns it automatically (defaults to 10000) and the backend already reads `process.env.PORT` |

Optional, not required to deploy (see `backend/src/config.js` — the app
runs fine without these, `emailService` just logs instead of sending):
`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`. Add them
in the Render Dashboard under the backend service's Environment tab if you
want the forgot-password flow to send real emails instead of logging what
would have been sent.

Also optional, but worth knowing about — **avatar upload won't work
without these**, and unlike `JWT_SECRET`/`MONGODB_URI` the app won't
refuse to start or warn you; it just fails silently the first time
someone tries to upload a photo:
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
(see `backend/src/config/cloudinary.js` — a free Cloudinary account
provides all three from its dashboard). Add them the same way, in the
backend service's Environment tab.

## Verifying it actually worked

Don't just check that both services show "Live" in the dashboard — that
only confirms the build succeeded, not that they can talk to each other.
Do the same two-account, one-board, two-window check from
`docs/SOCKET_EVENTS.md`'s testing section, against the real deployed
`collabboard-client-p85o.onrender.com` URL. If presence and live task sync work
there, CORS, the socket connection, and Atlas are all confirmed correctly
wired — that one walkthrough exercises all three at once.
