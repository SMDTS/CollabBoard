// backend/tests/auth.test.js
import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

describe("POST /api/auth/register", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  it("returns 400 for a weak password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "test@flowty.dev", password: "short" });
    expect(res.status).toBe(400);
  });

  it("registers a new user and returns a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test", email: "test@flowty.dev", password: "atleast8chars" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("test@flowty.dev");
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/api/auth/register").send({ name: "A", email: "dup@flowty.dev", password: "atleast8chars" });
    const res = await request(app).post("/api/auth/register").send({ name: "B", email: "dup@flowty.dev", password: "atleast8chars" });
    expect(res.status).toBe(409);
  });
});