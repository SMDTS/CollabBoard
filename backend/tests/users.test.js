// backend/tests/users.test.js
//
// Coverage:
//   - GET /api/users?q= matches a candidate by name
//   - GET /api/users?q= matches a candidate by email (a query that only
//     appears in the email, not the name, still finds them)
//   - GET /api/users?q= excludes the requester themselves, even when the
//     query also matches the requester's own name/email
//   - POST /api/auth/register on an already-used email returns a clean
//     409, not a raw MongoDB duplicate-key error

import request from "supertest";
import app from "../src/app.js";
import { connectTestDb, clearTestDb, closeTestDb } from "./setup/db.js";

function authHeader(token) {
  return `Bearer ${token}`;
}

async function registerUser({ name, email }) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password: "atleast8chars" });
  return { token: res.body.token, user: res.body.user, status: res.status };
}

function ids(users) {
  return users.map((u) => u.id);
}

describe("GET /api/users?q=", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  it("matches a candidate by name", async () => {
    const searcher = await registerUser({ name: "Searcher Sam", email: `searcher-${Date.now()}@flowty.dev` });
    const nameMatch = await registerUser({ name: "Alice Match", email: `alice-${Date.now()}@flowty.dev` });
    const irrelevant = await registerUser({ name: "Bob Other", email: `bob-${Date.now()}@flowty.dev` });

    const res = await request(app)
      .get("/api/users?q=Alice")
      .set("Authorization", authHeader(searcher.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(nameMatch.user.id);
    expect(ids(res.body)).not.toContain(irrelevant.user.id);
  });

  it("matches a candidate by email, even when the query isn't in their name", async () => {
    const searcher = await registerUser({ name: "Searcher Sam", email: `searcher-${Date.now()}@flowty.dev` });
    // "zzztoken" appears only in this user's email, not their name — a
    // hit here can only have come from matching on email.
    const emailMatch = await registerUser({ name: "Casey Carter", email: `casey-zzztoken-${Date.now()}@flowty.dev` });
    const irrelevant = await registerUser({ name: "Dana Diaz", email: `dana-${Date.now()}@flowty.dev` });

    const res = await request(app)
      .get("/api/users?q=zzztoken")
      .set("Authorization", authHeader(searcher.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(emailMatch.user.id);
    expect(ids(res.body)).not.toContain(irrelevant.user.id);
  });

  it("excludes the requester from results, even when the query matches their own name", async () => {
    // Both the searcher and the decoy have "Sam" in their name, so a
    // search for "sam" matches both — the requester must still be
    // filtered out of their own results.
    const searcher = await registerUser({ name: "Searcher Sam", email: `searcher-${Date.now()}@flowty.dev` });
    const decoy = await registerUser({ name: "Sam Sameword", email: `sam-decoy-${Date.now()}@flowty.dev` });

    const res = await request(app)
      .get("/api/users?q=sam")
      .set("Authorization", authHeader(searcher.token));

    expect(res.status).toBe(200);
    expect(ids(res.body)).toContain(decoy.user.id);
    expect(ids(res.body)).not.toContain(searcher.user.id);
  });
});

describe("POST /api/auth/register duplicate email", () => {
  beforeAll(async () => connectTestDb());
  afterAll(async () => closeTestDb());
  beforeEach(async () => clearTestDb());

  it("returns 409 with a clean error body, not a raw MongoDB duplicate-key error", async () => {
    const email = `dup-${Date.now()}@flowty.dev`;
    const first = await registerUser({ name: "First Account", email });
    expect(first.status).toBe(201);

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Second Account", email, password: "atleast8chars" });

    expect(res.status).toBe(409);
    // A raw Mongo duplicate-key error wouldn't come back through the
    // app's normal error shape — this confirms it was caught and
    // converted, not leaked as a 500.
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe("CONFLICT");
  });
});
