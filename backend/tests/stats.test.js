// backend/tests/stats.test.js
//
// Coverage:
//   - GET /api/boards/:id/stats groups by assignee and returns exact
//     taskCount/overdueCount numbers for a known, seeded set of tasks —
//     not just a 200 with *some* body.
//   - "overdue" is judged against a due date strictly before today, so
//     the seed uses one due date far in the past (guaranteed overdue)
//     and dates that are either in the future or unparsable ("No date"),
//     which the endpoint's best-effort parser treats as "no due date"
//     rather than overdue.
//   - A user who isn't the board's owner or a member gets 403, not board
//     stats they have no business seeing.

import request from "supertest";
import app from "../src/app.js";
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
    .send({ name: "Stats Board", ...overrides });
  return res.body;
}

// Only the board owner can create/assign tasks (see taskService.createTask),
// so every seed task in this file is created by `ownerToken`.
async function createTask(ownerToken, { boardId, columnId, assigneeId, title, dueDate }) {
  const res = await request(app)
    .post("/api/tasks")
    .set("Authorization", authHeader(ownerToken))
    .send({ title, assigneeId, boardId, columnId, dueDate });
  return res;
}

describe("GET /api/boards/:id/stats", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  it("returns exact per-assignee task and overdue counts for the seeded tasks", async () => {
    // userA owns the board (and is also assigned some of its tasks);
    // userB is a plain member who gets the rest of the tasks assigned.
    const userA = await registerUser({ name: "Ann Owner", email: `ann-${Date.now()}@flowty.dev` });
    const userB = await registerUser({ name: "Bo Member", email: `bo-${Date.now()}@flowty.dev` });

    const board = await createBoard(userA.token);
    await addBoardMember(board.id, userB.user.id);
    const columnId = board.columns[0].id;

    // userA: 3 tasks, exactly 1 overdue.
    await createTask(userA.token, {
      boardId: board.id,
      columnId,
      assigneeId: userA.user.id,
      title: "A - overdue",
      dueDate: "2020-01-01", // unambiguously in the past
    });
    await createTask(userA.token, {
      boardId: board.id,
      columnId,
      assigneeId: userA.user.id,
      title: "A - future",
      dueDate: "2099-01-01", // unambiguously in the future
    });
    await createTask(userA.token, {
      boardId: board.id,
      columnId,
      assigneeId: userA.user.id,
      title: "A - unparsable",
      dueDate: "No date", // not recognised by the parser -> not overdue
    });

    // userB: 2 tasks, 0 overdue.
    await createTask(userA.token, {
      boardId: board.id,
      columnId,
      assigneeId: userB.user.id,
      title: "B - future",
      dueDate: "2099-06-15",
    });
    await createTask(userA.token, {
      boardId: board.id,
      columnId,
      assigneeId: userB.user.id,
      title: "B - unparsable",
      dueDate: "No date",
    });

    const res = await request(app)
      .get(`/api/boards/${board.id}/stats`)
      .set("Authorization", authHeader(userA.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);

    const statsById = Object.fromEntries(res.body.map((entry) => [entry.assigneeId, entry]));

    expect(statsById[userA.user.id]).toMatchObject({ taskCount: 3, overdueCount: 1 });
    expect(statsById[userB.user.id]).toMatchObject({ taskCount: 2, overdueCount: 0 });
  });

  it("returns 403 for a user who is neither the board owner nor a member", async () => {
    const owner = await registerUser();
    const outsider = await registerUser();
    const board = await createBoard(owner.token);

    const res = await request(app)
      .get(`/api/boards/${board.id}/stats`)
      .set("Authorization", authHeader(outsider.token));

    expect(res.status).toBe(403);
  });
});
