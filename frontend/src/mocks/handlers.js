// frontend/src/mocks/handlers.js
import { http, HttpResponse } from "msw";

const BASE_URL = "http://localhost:4000"; // matches VITE_API_URL in frontend/.env

export const handlers = [
  http.get(`${BASE_URL}/api/boards`, () =>
    HttpResponse.json([
      { id: "board-1", name: "Marketing Launch", ownerId: "user-999", columns: [] },
    ])
  ),
  // TeamPage always fetches stats for the selected board on mount, even
  // though it swallows failures — leave this mocked so unrelated tests
  // don't have to know it exists.
  http.get(`${BASE_URL}/api/boards/:boardId/stats`, () => HttpResponse.json([])),
];
