// backend/tests/activity.test.js
//
// Coverage:
//   - creating a task logs a "created" activity entry
//   - moving a task's column logs a "moved" activity entry
//   - deleting a task logs a "deleted" activity entry, and the entry keeps
//     the task's title even after the task itself is gone (denormalized
//     `taskTitle` on the Activity model)
//   - the feed is sorted most-recent-first
//   - `?limit=` caps how many entries come back
//   - `?boardId=` scopes the feed to a single board
//
// NOTE on the last point: `Activity.board` (src/models/Activity.js) is a
// `Schema.Types.Mixed` field, and it gets populated from `task.boardId`
// (src/services/taskService.js), which — because Task.boardId is a real
// `Schema.Types.ObjectId` ref — is a BSON ObjectId by the time it reaches
// activityService.logActivity. But `GET /api/activity?boardId=..`
// (activityController.listActivity -> activityRepository.findRecent)
// filters with `{ board: boardId }` using the raw query-string value,
// i.e. a plain JS string. Mongoose does not cast query values on a Mixed
// path, so MongoDB compares a stored ObjectId against a queried string —
// different BSON types never match. The scoped-filtering test below
// asserts the *intended* behavior (only that board's activity comes
// back), so if this reasoning is right, that one test should fail with
// an empty array where entries were expected. If it does, the fix is
// either casting in the repository (`new mongoose.Types.ObjectId(boardId)`
// before querying) or storing `board` as a real ObjectId ref instead of
// Mixed.

import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

function authedPost(path, token) {
  return request(app).post(path).set("Authorization", `Bearer ${token}`);
}
function authedGet(path, token) {
  return request(app).get(path).set("Authorization", `Bearer ${token}`);
}
function authedPatch(path, token) {
  return request(app).patch(path).set("Authorization", `Bearer ${token}`);
}
function authedDelete(path, token) {
  return request(app).delete(path).set("Authorization", `Bearer ${token}`);
}

let userCounter = 0;
async function registerUser(overrides = {}) {
  userCounter += 1;
  const payload = {
    name: `Test User ${userCounter}`,
    email: `user${userCounter}@flowty.dev`,
    password: "atleast8chars",
    ...overrides,
  };
  const res = await request(app).post("/api/auth/register").send(payload);
  if (res.status !== 201) {
    throw new Error(`registerUser failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { token: res.body.token, user: res.body.user };
}

async function createBoard(token, overrides = {}) {
  const res = await authedPost("/api/boards", token).send({ name: "Board", ...overrides });
  if (res.status !== 201) {
    throw new Error(`createBoard failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

function columnId(board, title) {
  const col = board.columns.find((c) => c.title === title);
  if (!col) throw new Error(`Board has no "${title}" column`);
  return col.id;
}

async function createTask(token, { boardId, columnId: colId, assigneeId, title = "Untitled task", ...rest }) {
  const res = await authedPost("/api/tasks", token).send({
    title,
    boardId,
    columnId: colId,
    assigneeId,
    ...rest,
  });
  if (res.status !== 201) {
    throw new Error(`createTask failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Activity feed", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  it("logs a 'created' activity entry when a task is created", async () => {
    const { token, user } = await registerUser();
    const board = await createBoard(token, { name: "Marketing" });
    const toDo = columnId(board, "To Do");

    await createTask(token, {
      boardId: board.id,
      columnId: toDo,
      assigneeId: user.id,
      title: "Draft the launch email",
    });

    const res = await authedGet("/api/activity", token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);

    const [entry] = res.body;
    expect(entry.action).toBe("created");
    expect(entry.message).toBe(`${user.name} created "Draft the launch email"`);
    expect(entry.board).toBe(board.id);
    expect(entry.actor).toEqual({ id: user.id, name: user.name });
    expect(entry).toHaveProperty("createdAt");
  });

  it("logs a 'moved' activity entry when a task's column changes", async () => {
    const { token, user } = await registerUser();
    const board = await createBoard(token, { name: "Engineering" });
    const toDo = columnId(board, "To Do");
    const doing = columnId(board, "Doing");

    const task = await createTask(token, {
      boardId: board.id,
      columnId: toDo,
      assigneeId: user.id,
      title: "Ship the release",
    });

    const moveRes = await authedPatch(`/api/tasks/${task.id}`, token).send({
      columnId: doing,
      version: task.version,
    });
    expect(moveRes.status).toBe(200);

    const res = await authedGet("/api/activity", token);
    expect(res.status).toBe(200);

    const moved = res.body.find((a) => a.action === "moved");
    expect(moved).toBeDefined();
    // The feed item only exposes `message` (not the raw `details` object),
    // and the message embeds the destination *column id*, not a friendly
    // column name — see activityService.toFeedItem/notifyBoardMembers.
    expect(moved.message).toBe(`${user.name} moved "Ship the release" to ${doing}`);
  });

  it("logs a 'deleted' activity entry that keeps the task's title after the task is gone", async () => {
    const { token, user } = await registerUser();
    const board = await createBoard(token, { name: "Design" });
    const toDo = columnId(board, "To Do");

    const task = await createTask(token, {
      boardId: board.id,
      columnId: toDo,
      assigneeId: user.id,
      title: "Redo the onboarding flow",
    });

    const deleteRes = await authedDelete(`/api/tasks/${task.id}`, token);
    expect(deleteRes.status).toBe(204);

    // The task really is gone.
    const getRes = await authedGet(`/api/tasks/${task.id}`, token);
    expect(getRes.status).toBe(404);

    const feedRes = await authedGet("/api/activity", token);
    const deleted = feedRes.body.find((a) => a.action === "deleted");
    expect(deleted).toBeDefined();
    expect(deleted.message).toBe(`${user.name} deleted "Redo the onboarding flow"`);
  });

  it("returns the feed most-recent-first", async () => {
    const { token, user } = await registerUser();
    const board = await createBoard(token, { name: "Ops" });
    const toDo = columnId(board, "To Do");

    const first = await createTask(token, {
      boardId: board.id,
      columnId: toDo,
      assigneeId: user.id,
      title: "First task",
    });
    await wait(10); // guarantee a distinct createdAt for a reliable sort check
    await createTask(token, {
      boardId: board.id,
      columnId: toDo,
      assigneeId: user.id,
      title: "Second task",
    });
    await wait(10);
    await authedDelete(`/api/tasks/${first.id}`, token);

    const res = await authedGet("/api/activity", token);
    expect(res.body).toHaveLength(3);
    expect(res.body.map((a) => a.action)).toEqual(["deleted", "created", "created"]);
    expect(res.body.map((a) => a.message)).toEqual([
      `${user.name} deleted "First task"`,
      `${user.name} created "Second task"`,
      `${user.name} created "First task"`,
    ]);
  });

  it("caps the feed at the given ?limit=", async () => {
    const { token, user } = await registerUser();
    const board = await createBoard(token, { name: "Support" });
    const toDo = columnId(board, "To Do");

    for (const title of ["Task A", "Task B", "Task C"]) {
      await createTask(token, { boardId: board.id, columnId: toDo, assigneeId: user.id, title });
      await wait(10);
    }

    const res = await authedGet("/api/activity?limit=2", token);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    // Most recent two, newest first.
    expect(res.body.map((a) => a.message)).toEqual([
      `${user.name} created "Task C"`,
      `${user.name} created "Task B"`,
    ]);
  });

  it("scopes the feed to one board via ?boardId=, leaving the global feed unfiltered", async () => {
    const { token, user } = await registerUser();
    const boardA = await createBoard(token, { name: "Board A" });
    const boardB = await createBoard(token, { name: "Board B" });

    await createTask(token, {
      boardId: boardA.id,
      columnId: columnId(boardA, "To Do"),
      assigneeId: user.id,
      title: "Board A task",
    });
    await createTask(token, {
      boardId: boardB.id,
      columnId: columnId(boardB, "To Do"),
      assigneeId: user.id,
      title: "Board B task",
    });

    const globalFeed = await authedGet("/api/activity", token);
    expect(globalFeed.status).toBe(200);
    expect(globalFeed.body).toHaveLength(2);

    const scopedFeed = await authedGet(`/api/activity?boardId=${boardA.id}`, token);
    expect(scopedFeed.status).toBe(200);
    expect(scopedFeed.body).toHaveLength(1);
    expect(scopedFeed.body[0].message).toBe(`${user.name} created "Board A task"`);
    expect(scopedFeed.body[0].board).toBe(boardA.id);

    const scopedFeedB = await authedGet(`/api/activity?boardId=${boardB.id}`, token);
    expect(scopedFeedB.body).toHaveLength(1);
    expect(scopedFeedB.body[0].message).toBe(`${user.name} created "Board B task"`);
  });
});