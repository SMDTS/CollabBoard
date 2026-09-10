import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

const NONEXISTENT_ID = "5f50c31f0a1b2c3d4e5f6789";

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

function authHeader(token) {
  return `Bearer ${token}`;
}

describe("Board API", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  describe("CRUD", () => {
    it("creates a board with default columns", async () => {
      const { token, user } = await registerUser();

      const res = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Sprint Board", description: "Q3 sprint" });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Sprint Board");
      expect(res.body.ownerId).toBe(user.id);
      expect(res.body.memberIds).toEqual([]);
      expect(res.body.columns).toHaveLength(3);
      expect(res.body.columns.map((c) => c.title)).toEqual(["To Do", "Doing", "Done"]);
    });

    it("lists boards belonging to the requesting user", async () => {
      const { token } = await registerUser();
      await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Board A" });

      const res = await request(app).get("/api/boards").set("Authorization", authHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Board A");
    });

    it("gets a single board by id", async () => {
      const { token } = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Board B" });

      const res = await request(app)
        .get(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe("Board B");
    });

    it("updates a board's name and description", async () => {
      const { token } = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Old Name" });

      const res = await request(app)
        .patch(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(token))
        .send({ name: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
      expect(res.body.name).toBe("New Name");
    });

    it("deletes a board", async () => {
      const { token } = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Doomed Board" });

      const deleteRes = await request(app)
        .delete(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(token));
      expect(deleteRes.status).toBe(204);

      const getRes = await request(app)
        .get(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(token));
      expect(getRes.status).toBe(404);
    });
  });

  describe("Permissions", () => {
    it("returns 403 when a non-owner tries to update the board", async () => {
      const owner = await registerUser();
      const intruder = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(owner.token))
        .send({ name: "Owner's Board" });

      const res = await request(app)
        .patch(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(intruder.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(403);
    });

    it("returns 403 when a non-owner tries to delete the board", async () => {
      const owner = await registerUser();
      const intruder = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(owner.token))
        .send({ name: "Owner's Board" });

      const res = await request(app)
        .delete(`/api/boards/${created.body.id}`)
        .set("Authorization", authHeader(intruder.token));

      expect(res.status).toBe(403);
    });
  });

  describe("404 handling", () => {
    it("returns 404 when getting a well-formed but nonexistent board id", async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .get(`/api/boards/${NONEXISTENT_ID}`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(404);
    });

    it("returns 404 when deleting a well-formed but nonexistent board id", async () => {
      const { token } = await registerUser();

      const res = await request(app)
        .delete(`/api/boards/${NONEXISTENT_ID}`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(404);
    });
  });

  describe("Board stats", () => {
    it("returns an array of per-assignee stat entries", async () => {
      const { token } = await registerUser();
      const created = await request(app)
        .post("/api/boards")
        .set("Authorization", authHeader(token))
        .send({ name: "Stats Board" });

      const res = await request(app)
        .get(`/api/boards/${created.body.id}/stats`)
        .set("Authorization", authHeader(token));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
