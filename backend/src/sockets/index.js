// src/sockets/index.js
//
// Attaches Socket.IO to the same HTTP server Express already listens on.
// Responsibilities kept deliberately narrow:
//   - authenticate the handshake once (a socket is a connection, not a
//     per-request call — see authenticate.js for the REST equivalent)
//   - let a client join the room for each board it actually has access to
//   - track who's connected per board and broadcast presence
// Emitting domain events (task:created etc.) happens from the REST
// controllers, which pull `req.app.get("io")` — this file only sets the
// connection up, it doesn't know about tasks.
import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import * as boardRepository from "../repositories/boardRepository.js";

const BOARD_ROOM_PREFIX = "board:";

export function attachSockets(httpServer, config) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true,
    },
  });

  // --- handshake auth ---------------------------------------------------
  // Same JWT everything else in the app uses, verified once when the
  // connection is established. Never accept a token from the query
  // string — it ends up in server/proxy access logs. socket.handshake.auth
  // is sent in the handshake body instead.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("NO_TOKEN"));
    try {
      const payload = verifyToken(token);
      socket.user = { id: payload.sub };
      next();
    } catch {
      next(new Error("BAD_TOKEN"));
    }
  });

  // boardId -> Map(userId -> number of open sockets for that user on that board)
  // A count, not a Set, because one person can have the board open in two
  // tabs — they shouldn't drop off the presence list until *both* close.
  const presence = new Map();

  function announcePresence(boardId) {
    const users = [...(presence.get(boardId)?.keys() ?? [])];
    io.to(BOARD_ROOM_PREFIX + boardId).emit("presence:update", { boardId, users });
  }

  io.on("connection", (socket) => {
    socket.on("board:join", async (boardId) => {
      if (typeof boardId !== "string" || !boardId.trim()) return;

      // Don't let a socket join a room for a board it can't see — the
      // REST API scopes reads to owner-or-member, sockets should too.
      const board = await boardRepository.findById(boardId).catch(() => null);
      if (!board) return;
      const userId = socket.user.id;
      const isOwner = board.owner.toString() === userId;
      const isMember = board.members.some((m) => m.toString() === userId);
      if (!isOwner && !isMember) return;

      socket.join(BOARD_ROOM_PREFIX + boardId);

      const boardPresence = presence.get(boardId) ?? new Map();
      boardPresence.set(userId, (boardPresence.get(userId) ?? 0) + 1);
      presence.set(boardId, boardPresence);

      socket.emit("board:joined", boardId);
      announcePresence(boardId);
    });

    socket.on("board:leave", (boardId) => {
      if (typeof boardId !== "string") return;
      socket.leave(BOARD_ROOM_PREFIX + boardId);
      dropPresence(boardId, socket.user.id);
      announcePresence(boardId);
    });

    // Fires before the socket actually disconnects, while socket.rooms is
    // still populated — this is what makes a browser-tab close (not just
    // an explicit board:leave) clean up presence correctly.
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (!room.startsWith(BOARD_ROOM_PREFIX)) continue;
        const boardId = room.slice(BOARD_ROOM_PREFIX.length);
        dropPresence(boardId, socket.user.id);
        announcePresence(boardId);
      }
    });
  });

  function dropPresence(boardId, userId) {
    const boardPresence = presence.get(boardId);
    if (!boardPresence) return;
    const remaining = (boardPresence.get(userId) ?? 1) - 1;
    if (remaining > 0) boardPresence.set(userId, remaining);
    else boardPresence.delete(userId);
  }

  return io;
}

// Small helper so controllers don't need to know the room-naming scheme.
export function emitToBoard(io, boardId, event, payload) {
  io?.to(BOARD_ROOM_PREFIX + boardId).emit(event, payload);
}
