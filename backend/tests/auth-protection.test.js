// backend/tests/auth-protection.test.js
//
// Every route below sits behind `authenticate` (either via `router.use(authenticate)`
// at the top of its route file, or — for /api/auth/me — inline on that one route).
// `authenticate` runs before any body validation or controller logic, so it
// doesn't matter that the :id/:userId placeholders below aren't real
// documents; an unauthenticated or badly-authenticated request should never
// get far enough to care. No DB connection is needed for these tests, same
// as tests/health.test.js.

import request from "supertest";
import app from "../src/app.js";

const ID_A = "507f1f77bcf86cd799439011";
const ID_B = "507f191e810c19729de860ea";

// One entry per protected route in the app. Grouped by router to make it
// easy to cross-check against src/routes/*.js if a route is ever added,
// removed, or re-protected.
const PROTECTED_ROUTES = [
  // taskRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/tasks" },
  { method: "get", path: `/api/tasks/${ID_A}` },
  { method: "post", path: "/api/tasks" },
  { method: "patch", path: `/api/tasks/${ID_A}` },
  { method: "delete", path: `/api/tasks/${ID_A}` },

  // boardRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/boards" },
  { method: "get", path: `/api/boards/${ID_A}` },
  { method: "get", path: `/api/boards/${ID_A}/stats` },
  { method: "get", path: `/api/boards/${ID_A}/members` },
  { method: "post", path: `/api/boards/${ID_A}/members` },
  { method: "get", path: `/api/boards/${ID_A}/invitations` },
  { method: "delete", path: `/api/boards/${ID_A}/members/${ID_B}` },
  { method: "post", path: "/api/boards" },
  { method: "patch", path: `/api/boards/${ID_A}` },
  { method: "delete", path: `/api/boards/${ID_A}` },

  // userRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/users" },
  { method: "patch", path: "/api/users/me/preferences" },

  // activityRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/activity" },

  // invitationRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/invitations" },
  { method: "post", path: `/api/invitations/${ID_A}/respond` },

  // notificationRoutes.js — router.use(authenticate)
  { method: "get", path: "/api/notifications" },
  { method: "post", path: "/api/notifications/read-all" },
  { method: "post", path: `/api/notifications/${ID_A}/read` },

  // authRoutes.js — authenticate applied inline, only on this one route
  { method: "get", path: "/api/auth/me" },
];

describe.each(PROTECTED_ROUTES)("$method $path", ({ method, path }) => {
  it("returns 401 with no Authorization header", async () => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Missing or malformed Authorization header");
  });

  it("returns 401 with a garbage bearer token", async () => {
    const res = await request(app)[method](path).set("Authorization", "Bearer this.is-not.a-real-jwt");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Invalid or expired token");
  });
});

describe("authenticate edge cases", () => {
  it("returns 401 when the Authorization header isn't a Bearer scheme", async () => {
    const res = await request(app).get("/api/tasks").set("Authorization", "Basic dXNlcjpwYXNz");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Missing or malformed Authorization header");
  });

  it("returns 401 for an empty Bearer token", async () => {
    const res = await request(app).get("/api/tasks").set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe("Invalid or expired token");
  });
});
