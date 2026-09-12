// backend/tests/sockets.test.js
//
// Unlike the other test files, this one needs a real listening HTTP
// server (supertest's app-wrapping trick doesn't work for a WebSocket
// upgrade) — so it spins one up on an ephemeral port with Socket.IO
// attached exactly the way src/server.js does, and connects to it with
// real socket.io-client sockets.
//
// Coverage:
//   - Handshake auth: no token / bad token rejected, valid token accepted
//   - board:join only succeeds for the board's actual owner/members
//   - task:created / task:updated / task:deleted are broadcast to the
//     board's room, each carrying actorId, after the corresponding REST
//     call succeeds
//   - presence:update reflects sockets joining, adding, and leaving a
//     board's room

import { createServer } from "node:http";
import request from "supertest";
import { io as ioClient } from "socket.io-client";
import app from "../src/app.js";
import { config } from "../src/config.js";
import { attachSockets } from "../src/sockets/index.js";
import { Board } from "../src/models/Board.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

function authHeader(token) {
  return `Bearer ${token}`;
}

async function registerUser(overrides = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email: `user-${Date.now()}-${Math.random()}@flowty.dev`,
      password: "atleast8chars",
      ...overrides,
    });
  return { token: res.body.token, user: res.body.user };
}

async function addBoardMember(boardId, userId) {
  await Board.findByIdAndUpdate(boardId, { $addToSet: { members: userId } });
}

async function createBoard(token, overrides = {}) {
  const res = await request(app)
    .post("/api/boards")
    .set("Authorization", authHeader(token))
    .send({ name: "Test Board", ...overrides });
  return res.body;
}

function waitForEvent(socket, event, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timed out waiting for "${event}"`)),
      timeoutMs
    );
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });
}

// The inverse check — confirms an event does NOT arrive, for asserting a
// permission boundary held (e.g. a non-member's board:join was ignored).
function assertNoEvent(socket, event, withinMs = 400) {
  return new Promise((resolve, reject) => {
    const onEvent = () => {
      clearTimeout(timer);
      reject(new Error(`Expected no "${event}", but one arrived`));
    };
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      resolve();
    }, withinMs);
    socket.once(event, onEvent);
  });
}

describe("Socket.IO real-time layer", () => {
  let httpServer;
  let io;
  let baseUrl;
  const openSockets = [];

  beforeAll(async () => {
    await connectTestDb();

    httpServer = createServer(app);
    io = attachSockets(httpServer, config);
    app.set("io", io);

    await new Promise((resolve) => httpServer.listen(0, resolve));
    const { port } = httpServer.address();
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(async () => {
    io?.close();
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await closeTestDb();
  });

  afterEach(async () => {
    for (const socket of openSockets.splice(0)) {
      if (socket.connected) socket.disconnect();
    }
    await clearTestDb();
  });

  // Tracks every socket opened during a test so afterEach can always
  // clean it up, even if the test fails partway through.
  function connectAs(token) {
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
    });
    openSockets.push(socket);
    return socket;
  }

  describe("handshake auth", () => {
    it("rejects a connection with no token", async () => {
      const socket = ioClient(baseUrl, { transports: ["websocket"], forceNew: true });
      openSockets.push(socket);
      const err = await waitForEvent(socket, "connect_error");
      expect(err.message).toBe("NO_TOKEN");
    });

    it("rejects a connection with an invalid token", async () => {
      const socket = connectAs("this-is-not-a-real-jwt");
      const err = await waitForEvent(socket, "connect_error");
      expect(err.message).toBe("BAD_TOKEN");
    });

    it("accepts a connection with a valid token", async () => {
      const { token } = await registerUser();
      const socket = connectAs(token);
      await waitForEvent(socket, "connect");
      expect(socket.connected).toBe(true);
    });
  });

  describe("board:join permission check", () => {
    it("joins the room for a board the user owns", async () => {
      const { token } = await registerUser();
      const board = await createBoard(token);
      const socket = connectAs(token);
      await waitForEvent(socket, "connect");

      socket.emit("board:join", board.id);
      const joinedBoardId = await waitForEvent(socket, "board:joined");
      expect(joinedBoardId).toBe(board.id);
    });

    it("does not join the room for a board the user has no access to", async () => {
      const { token: ownerToken } = await registerUser();
      const board = await createBoard(ownerToken);
      const { token: outsiderToken } = await registerUser();

      const socket = connectAs(outsiderToken);
      await waitForEvent(socket, "connect");

      socket.emit("board:join", board.id);
      await assertNoEvent(socket, "board:joined");
    });
  });

  describe("task events", () => {
    async function setupBoardWithMember() {
      const { token: ownerToken, user: owner } = await registerUser();
      const { token: memberToken, user: member } = await registerUser();
      const board = await createBoard(ownerToken);
      await addBoardMember(board.id, member.id);
      return { ownerToken, owner, memberToken, member, board };
    }

    async function joinedSocket(token, boardId) {
      const socket = connectAs(token);
      await waitForEvent(socket, "connect");
      socket.emit("board:join", boardId);
      await waitForEvent(socket, "board:joined");
      return socket;
    }

    it("broadcasts task:created to everyone in the board room, with actorId", async () => {
      const { ownerToken, owner, memberToken, board } = await setupBoardWithMember();
      const ownerSocket = await joinedSocket(ownerToken, board.id);
      const memberSocket = await joinedSocket(memberToken, board.id);
      const columnId = board.columns[0].id;

      const [ownerEvent, memberEvent, createRes] = await Promise.all([
        waitForEvent(ownerSocket, "task:created"),
        waitForEvent(memberSocket, "task:created"),
        request(app)
          .post("/api/tasks")
          .set("Authorization", authHeader(ownerToken))
          .send({ title: "Real-time test task", boardId: board.id, columnId, assigneeId: owner.id }),
      ]);

      expect(createRes.status).toBe(201);
      expect(ownerEvent.actorId).toBe(owner.id);
      expect(ownerEvent.task.id).toBe(createRes.body.id);
      expect(memberEvent.task.id).toBe(createRes.body.id);
      expect(memberEvent.task.title).toBe("Real-time test task");
    });

    it("broadcasts task:updated with the new version after an assignee moves a card", async () => {
      const { ownerToken, memberToken, member, board } = await setupBoardWithMember();
      const columnId = board.columns[0].id;
      const movedToColumnId = board.columns[1].id;

      const created = await request(app)
        .post("/api/tasks")
        .set("Authorization", authHeader(ownerToken))
        .send({ title: "Move me", boardId: board.id, columnId, assigneeId: member.id });

      const ownerSocket = await joinedSocket(ownerToken, board.id);

      const [event, updateRes] = await Promise.all([
        waitForEvent(ownerSocket, "task:updated"),
        request(app)
          .patch(`/api/tasks/${created.body.id}`)
          .set("Authorization", authHeader(memberToken))
          .send({ columnId: movedToColumnId, version: created.body.version }),
      ]);

      expect(updateRes.status).toBe(200);
      expect(event.actorId).toBe(member.id);
      expect(event.task.columnId).toBe(movedToColumnId);
      expect(event.task.version).toBe(created.body.version + 1);
    });

    it("broadcasts task:deleted with the task id and boardId", async () => {
      const { ownerToken, owner, board } = await setupBoardWithMember();
      const columnId = board.columns[0].id;

      const created = await request(app)
        .post("/api/tasks")
        .set("Authorization", authHeader(ownerToken))
        .send({ title: "Delete me", boardId: board.id, columnId, assigneeId: owner.id });

      const ownerSocket = await joinedSocket(ownerToken, board.id);

      const [event, deleteRes] = await Promise.all([
        waitForEvent(ownerSocket, "task:deleted"),
        request(app)
          .delete(`/api/tasks/${created.body.id}`)
          .set("Authorization", authHeader(ownerToken)),
      ]);

      expect(deleteRes.status).toBe(204);
      expect(event.id).toBe(created.body.id);
      expect(event.boardId).toBe(board.id);
      expect(event.actorId).toBe(owner.id);
    });

    it("does not broadcast into a board room the socket never joined", async () => {
      const { ownerToken, owner, board } = await setupBoardWithMember();
      const columnId = board.columns[0].id;

      // Deliberately never joins the board room.
      const socket = connectAs(ownerToken);
      await waitForEvent(socket, "connect");

      const [, createRes] = await Promise.all([
        assertNoEvent(socket, "task:created"),
        request(app)
          .post("/api/tasks")
          .set("Authorization", authHeader(ownerToken))
          .send({ title: "Should not be seen", boardId: board.id, columnId, assigneeId: owner.id }),
      ]);

      expect(createRes.status).toBe(201);
    });
  });

  describe("presence", () => {
    it("reports who's connected to a board and updates as sockets join/leave", async () => {
      const { token: ownerToken, user: owner } = await registerUser();
      const { token: memberToken, user: member } = await registerUser();
      const board = await createBoard(ownerToken);
      await addBoardMember(board.id, member.id);

      const ownerSocket = connectAs(ownerToken);
      await waitForEvent(ownerSocket, "connect");
      ownerSocket.emit("board:join", board.id);
      const firstUpdate = await waitForEvent(ownerSocket, "presence:update");
      expect(firstUpdate.boardId).toBe(board.id);
      expect(firstUpdate.users).toEqual([owner.id]);

      const memberSocket = connectAs(memberToken);
      await waitForEvent(memberSocket, "connect");

      const bothJoinedUpdate = waitForEvent(ownerSocket, "presence:update");
      memberSocket.emit("board:join", board.id);
      const secondUpdate = await bothJoinedUpdate;
      expect(new Set(secondUpdate.users)).toEqual(new Set([owner.id, member.id]));

      const afterLeaveUpdate = waitForEvent(ownerSocket, "presence:update");
      memberSocket.disconnect();
      const thirdUpdate = await afterLeaveUpdate;
      expect(thirdUpdate.users).toEqual([owner.id]);
    });
  });
});
