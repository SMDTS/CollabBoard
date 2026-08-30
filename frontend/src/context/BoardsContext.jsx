// BoardsContext.jsx
// Same pattern as TasksContext: one fetch on mount, shared state, every
// page reads from here instead of each doing its own fetch (or, before
// this, each importing the same static mock array independently).
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as boardsApi from "../api/boards.js";

const BoardsStateContext = createContext(null);
const BoardsActionsContext = createContext(null);

export function BoardsProvider({ children }) {
  const [boards, setBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return boardsApi
      .fetchBoards()
      .then(setBoards)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addBoard = async (name, description = "") => {
    const board = await boardsApi.createBoard({ name, description });
    setBoards((prev) => [...prev, board]);
    return board;
  };

  const editBoard = async (id, patch) => {
    const updated = await boardsApi.updateBoard(id, patch);
    setBoards((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  };

  const removeBoard = async (id) => {
    await boardsApi.deleteBoard(id);
    setBoards((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <BoardsStateContext.Provider value={{ boards, isLoading, error }}>
      <BoardsActionsContext.Provider value={{ addBoard, editBoard, removeBoard, reload }}>
        {children}
      </BoardsActionsContext.Provider>
    </BoardsStateContext.Provider>
  );
}

export function useBoards() {
  return useContext(BoardsStateContext);
}

export function useBoardsActions() {
  return useContext(BoardsActionsContext);
}
