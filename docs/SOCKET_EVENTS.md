# Real-Time Event Contract

Socket.IO events layered on top of the REST API above — not a replacement
for it. Every mutation still goes through the normal `POST`/`PATCH`/`DELETE`
endpoints in `API_CONTRACT.md`; the events below are what the server pushes
out *after* one of those requests succeeds, so every other client sees it
without polling.

_Connects to the same origin as the REST API (`VITE_API_URL`). Socket.IO's
default path (`/socket.io/`) is separate from `/api/*`, so both share one
HTTP server with no route collisions — see `backend/src/server.js`._

## Connecting

The client passes the same JWT the REST API uses, in the handshake `auth`
payload — never in the query string, since query strings end up in
server/proxy access logs:

```js
io(BASE_URL, { auth: { token } });
```

| Failure | `connect_error` message | Client behavior |
|---|---|---|
| No token sent | `NO_TOKEN` | Treated as session-expired — logs the user out (same as a `401` from the REST API would) |
| Token invalid/expired | `BAD_TOKEN` | Same as above |

A successful connection does **not** imply the client is in any board's
room yet — see `board:join` below.

## Rooms

One room per board: `board:<boardId>`. A socket only receives a board's
task/presence events while it's joined to that room.

| Event (client → server) | Payload | Server behavior |
|---|---|---|
| `board:join` | `boardId` (string) | Verifies the connected user is that board's owner or a member (same check `GET /api/boards/:id` uses) before joining the room. Silently does nothing if the check fails or the board doesn't exist — joining isn't itself a resource, so there's nothing to return a `403`/`404` for. |
| `board:leave` | `boardId` (string) | Leaves the room, updates presence for that board. |

| Event (server → client) | Payload | When |
|---|---|---|
| `board:joined` | `boardId` (string) | Acknowledges a successful `board:join`. |

The client joins the room for every board in the user's board list on
connect (`SocketContext.jsx`), and again whenever a new board is added to
that list (e.g. just created, or an invite just accepted) — it doesn't
wait for the user to actually open that board's page.

## Task events

Emitted by the REST controllers (`taskController.js`) immediately after
`createTask` / `updateTask` / `deleteTask` succeed, to the room for the
task's board. These are the same task objects the REST API returns —
nothing socket-specific about their shape.

| Event | Payload | Emitted after |
|---|---|---|
| `task:created` | `{ task, actorId }` | `POST /api/tasks` |
| `task:updated` | `{ task, actorId }` | `PATCH /api/tasks/:id` — carries the task's new `version`, so a client that applies this event is already caught up for its own next edit's optimistic-concurrency check |
| `task:deleted` | `{ id, boardId, actorId }` | `DELETE /api/tasks/:id` |

`actorId` is the id of whoever made the REST call that triggered the
event. **Every client that receives one of these events — including the
one that made the change — checks `actorId` against its own logged-in
user id and skips re-applying its own action.** This is the socket
equivalent of `socket.to(room).emit(...)`'s auto-exclude-the-sender
behavior: it has to happen this way here because the mutation arrives over
a REST call, not a socket message, so there's no "sender socket" to
exclude at emit time.

On the client, an incoming task event is merged straight into the local
PouchDB store (`applyRemoteTask` / `removeRemoteTask` in
`frontend/src/db/tasksSync.js`) — the same doc-merge rules the polling
offline-sync already uses apply here too: a local doc that's `pending` or
`conflict` is left alone rather than overwritten, so a socket event can
never clobber work still in flight. The existing live PouchDB `changes`
feed then updates the UI; nothing about `TasksContext` had to change for
real-time to work.

## Presence

Per-board, in-memory, tracked by `backend/src/sockets/index.js` as the set
of currently-connected user ids in that board's room (a per-user socket
*count*, not a boolean — the same person with the board open in two tabs
shouldn't drop off the list until both are closed).

| Event (server → client) | Payload | Emitted when |
|---|---|---|
| `presence:update` | `{ boardId, users: [userId, ...] }` | Any join/leave/disconnect changes who's in that board's room |

The frontend's `usePresence(boardId)` hook (in `SocketContext.jsx`) reads
this into the "● N online" indicator in `BoardPage`'s header.

## Reconnection

Socket.IO reconnects automatically, but it does **not** replay events that
were emitted while a client was disconnected. On every `connect` event
(including the first connection and every reconnect after a dropped
network), the client re-joins every board room *and* triggers the same
`syncNow()` refetch the offline-sync loop already uses. This is
deliberate: trusting the stream to "catch up" would mean silently missing
whatever happened during the gap, where a refetch is the same cheap,
correct recovery path the app already had for coming back online.

## Not implemented

- **`member:joined` / `board:updated`** — inviting or removing a board
  member, or editing the board itself (name, description, columns),
  still requires a manual refresh to see from another session. Task
  events were the higher-value target for this milestone; this is the
  natural next extension of the same room/event pattern above.
- **Horizontal scaling** — presence and room membership live in the one
  Node process's memory. Fine for a single instance (per the brief); would
  need the Socket.IO Redis adapter before running more than one backend
  instance behind a load balancer.

## Testing status

- [x] `backend/tests/sockets.test.js` — an automated integration test, not
      just a manual check. Unlike the other test files, it can't use
      supertest's app-wrapping trick (there's no HTTP upgrade to hook
      into without a real listening server), so it spins up an actual
      `http.createServer` with Socket.IO attached — the same setup
      `server.js` uses — on an ephemeral port, and connects to it with
      real `socket.io-client` sockets. Covers:
  - handshake auth: connecting with no token / an invalid token is
    rejected (`NO_TOKEN` / `BAD_TOKEN`), a valid token is accepted
  - `board:join` succeeds for a board's owner/members and is silently
    ignored for anyone else, confirmed by asserting `board:joined`
    does **not** arrive within a timeout
  - `task:created` / `task:updated` / `task:deleted` are broadcast to
    everyone in the board's room, each carrying the correct `actorId`,
    after the real REST call succeeds — and are confirmed **not** to
    reach a socket that never joined that board's room
  - `presence:update` reflects a board's room membership correctly as
    sockets join, a second one joins, and one disconnects
- [x] Manual two-browser walkthrough — two accounts, one board, confirmed
      the presence indicator, a live card move between windows, the
      `101 Switching Protocols` WebSocket upgrade in DevTools, and
      reconnection after a dropped connection. Run against the Docker
      Compose setup specifically (`localhost:8080`, through nginx's
      `/socket.io/` proxy), not just the local dev servers — so this
      also confirms the proxy config above actually works, not just the
      socket code in isolation.
