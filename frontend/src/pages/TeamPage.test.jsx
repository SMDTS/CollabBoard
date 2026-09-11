// frontend/src/pages/TeamPage.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { server } from "../mocks/server.js";
import { AuthProvider } from "../context/AuthContext.jsx";
import { ToastProvider } from "../context/ToastContext.jsx";
import { BoardsProvider } from "../context/BoardsContext.jsx";
import TeamPage from "./TeamPage.jsx";

const BASE_URL = "http://localhost:4000";

function renderTeamPage() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <BoardsProvider>
          <TeamPage />
        </BoardsProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

// With no token in localStorage, AuthProvider resolves immediately without
// a network call, and with user === null, TeamPage's isOwner is false — so
// the invitation-search endpoints (fetchBoardInvitations, searchUsers)
// never fire. That keeps every test down to the two fetches we control:
// /api/boards (mocked once, in the shared handlers) and
// /api/boards/:id/members (overridden per test below).
describe("TeamPage members", () => {
  it("shows a loading state while the request is in flight", async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/:boardId/members`, async () => {
        await delay("infinite"); // never resolves during this test
        return HttpResponse.json([]);
      })
    );

    renderTeamPage();

    expect(await screen.findByText("Loading team…")).toBeInTheDocument();
  });

  it("shows members once the request succeeds", async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/:boardId/members`, () =>
        HttpResponse.json([
          { id: "u1", name: "Priya Patel", email: "priya@example.com", role: "owner" },
          { id: "u2", name: "Jordan Lee", email: "jordan@example.com", role: "member" },
        ])
      )
    );

    renderTeamPage();

    expect(await screen.findByText("Priya Patel")).toBeInTheDocument();
    expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    server.use(
      http.get(`${BASE_URL}/api/boards/:boardId/members`, () =>
        HttpResponse.json({ error: { message: "Server exploded" } }, { status: 500 })
      )
    );

    renderTeamPage();

    expect(await screen.findByText(/Couldn't load team: Server exploded/i)).toBeInTheDocument();
  });
});
