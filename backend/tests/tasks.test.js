// backend/tests/tasks.test.js
//
// Coverage:
//   - Task CRUD (create, list, get by id, delete) as an authenticated board owner
//   - The optimistic-concurrency 409 path: update once successfully (version
//     0 -> 1), then retry with the now-stale version and confirm it's
//     rejected *and* that the rejected request left the task's data alone
//   - The owner-vs-assignee permission split: the assignee may PATCH
//     columnId, but gets 403 trying to PATCH title
//   - A malformed task id in the URL returns 404, not a crashed 500

import request from "supertest";
import app from "../src/app.js";
import { Board } from "../src/models/Board.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

const MALFORMED_ID = "not-a-valid-object-id";

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

// Board membership invites go through the invitation-accept flow, which is
// out of scope for these tests — pushing straight into board.members here is
// just setup plumbing so we have a real, permitted assignee to test against.
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

async function createTask(token, { boardId, columnId, assigneeId, title = "Original Title" }) {
  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", authHeader(token))
    .send({ title, assigneeId, boardId, columnId });
  return res;
}

describe("Task API", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  describe("CRUD", () => {
    it("creates a task on a board", async () => {
      const { token, user } = await registerUser();
      const board = await createBoard(token);
      const columnId = board.columns[0].id;

      const res = await createTask(token, { boardId: board.id, columnId, assigneeId: user.id });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Original Title");
      expect(res.body.boardId).toBe(board.id);
      expect(res.body.columnId).toBe(columnId);
      expect(res.body.assigneeId).toBe(user.id);
      expect(res.body.version).toBe(0);
    });

    it("lists tasks belonging to the requesting user", async () => {
      const { token, user } = await registerUser();
      const board = await createBoard(token);
      const columnId = board.columns[0].id;
      await createTask(token, { boardId: board.id, columnId, assigneeId: user.id, title: "Task A" });

      const res = await request(app).get("/api/tasks").set("Authorization", authHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe("Task A");
    });

    it("gets a single task by id", async () => {
      const { token, user } = await registerUser();
      const board = await createBoard(token);
      const columnId = board.columns[0].id;
      const created = await createTask(token, { boardId: board.id, columnId, assigneeId: user.id });

      const res = await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.title).toBe("Original Title");
    });

    it("deletes a task", async () => {
      const { token, user } = await registerUser();
      const board = await createBoard(token);
      const columnId = board.columns[0].id;
      const created = await createTask(token, { boardId: board.id, columnId, assigneeId: user.id });

      const deleteRes = await request(app)
        .delete(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token));
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token));
      expect(getRes.status).toBe(404);
    });
  });

  describe("Optimistic concurrency (409 stale-version conflict)", () => {
    it("accepts an update at the current version, then rejects a retry at the now-stale version without changing the data", async () => {
      const { token, user } = await registerUser();
      const board = await createBoard(token);
      const columnId = board.columns[0].id;
      const created = await createTask(token, { boardId: board.id, columnId, assigneeId: user.id });
      expect(created.body.version).toBe(0);

      // First update: version 0 -> 1, succeeds.
      const firstUpdate = await request(app)
        .patch(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token))
        .send({ title: "Updated Once", version: 0 });

      expect(firstUpdate.status).toBe(200);
      expect(firstUpdate.body.title).toBe("Updated Once");
      expect(firstUpdate.body.version).toBe(1);

      // Second update: reuses the old version (0), which is now stale.
      const staleUpdate = await request(app)
        .patch(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token))
        .send({ title: "Malicious Overwrite", version: 0 });

      expect(staleUpdate.status).toBe(409);

      // The rejected request must not have touched the task's data.
      const current = await request(app)
        .get(`/api/tasks/${created.body.id}`)
        .set("Authorization", authHeader(token));

      expect(current.body.title).toBe("Updated Once");
      expect(current.body.version).toBe(1);
    });
  });

  describe("Owner-vs-assignee permissions", () => {
    async function setupOwnerAndAssignee() {
      const owner = await registerUser();
      const assignee = await registerUser();
      const board = await createBoard(owner.token);
      await addBoardMember(board.id, assignee.user.id);
      const columnId = board.columns[0].id;
      const otherColumnId = board.columns[1].id;
      const created = await createTask(owner.token, {
        boardId: board.id,
        columnId,
        assigneeId: assignee.user.id,
      });
      return { owner, assignee, board, columnId, otherColumnId, task: created.body };
    }

    it("lets the assignee PATCH columnId", async () => {
      const { assignee, otherColumnId, task } = await setupOwnerAndAssignee();

      const res = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", authHeader(assignee.token))
        .send({ columnId: otherColumnId, version: task.version });

      expect(res.status).toBe(200);
      expect(res.body.columnId).toBe(otherColumnId);
    });

    it("returns 403 when the assignee tries to PATCH the title", async () => {
      const { assignee, task } = await setupOwnerAndAssignee();

      const res = await request(app)
        .patch(`/api/tasks/${task.id}`)
        .set("Authorization", authHeader(assignee.token))
        .send({ title: "Assignee Edited This", version: task.version });

      expect(res.status).toBe(403);
    });
  });

  describe("Malformed id handling", () => {
    it("returns 404, not 500, when getting a task with a malformed id", async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get(`/api/tasks/${MALFORMED_ID}`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(404);
    });

    it("returns 404, not 500, when updating a task with a malformed id", async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .patch(`/api/tasks/${MALFORMED_ID}`)
        .set("Authorization", authHeader(token))
        .send({ title: "Doesn't matter", version: 0 });

      expect(res.status).toBe(404);
    });
  });
});
