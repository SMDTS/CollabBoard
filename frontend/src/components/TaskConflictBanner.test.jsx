// frontend/src/components/TaskConflictBanner.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskConflictBanner } from "./TaskConflictBanner";
import { useTaskConflicts, useTasksActions } from "../context/TasksContext.jsx";
import { useBoards } from "../context/BoardsContext.jsx";

vi.mock("../context/TasksContext.jsx", () => ({
  useTaskConflicts: vi.fn(),
  useTasksActions: vi.fn(),
}));

vi.mock("../context/BoardsContext.jsx", () => ({
  useBoards: vi.fn(),
}));

const board = {
  id: "board-1",
  columns: [
    { id: "col-todo", title: "To Do", position: 0 },
    { id: "col-done", title: "Done", position: 1 },
  ],
};

// title, assignee AND columnId all differ between the two versions, since
// that's the realistic case a conflict banner exists to show.
const localTask = {
  id: "task-1",
  boardId: "board-1",
  title: "Draft launch email",
  assignee: "Priya",
  columnId: "col-todo",
};

const serverTask = {
  ...localTask,
  title: "Send launch email",
  assignee: "Jordan",
  columnId: "col-done",
};

function setup(conflicts, resolveConflict = vi.fn()) {
  useTaskConflicts.mockReturnValue(conflicts);
  useTasksActions.mockReturnValue({ resolveConflict });
  useBoards.mockReturnValue({ boards: [board] });
  return { resolveConflict };
}

describe("TaskConflictBanner", () => {
  it("shows both conflicting versions of the task", () => {
    setup([{ taskId: "task-1", localTask, serverTask }]);
    render(<TaskConflictBanner />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText('"Draft launch email" changed on another device while you were editing it.')
    ).toBeInTheDocument();

    // "Your version" (local)
    expect(screen.getByText("Draft launch email")).toBeInTheDocument();
    expect(screen.getByText("Priya")).toBeInTheDocument();
    expect(screen.getByText("To Do")).toBeInTheDocument();

    // "Latest version" (server)
    expect(screen.getByText("Send launch email")).toBeInTheDocument();
    expect(screen.getByText("Jordan")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("resolves with keepLocal when 'Keep mine' is clicked", async () => {
    const user = userEvent.setup();
    const { resolveConflict } = setup([{ taskId: "task-1", localTask, serverTask }]);
    render(<TaskConflictBanner />);

    await user.click(screen.getByRole("button", { name: "Keep mine" }));

    expect(resolveConflict).toHaveBeenCalledWith("task-1", "keepLocal");
  });

  it("resolves with keepServer when 'Use latest' is clicked", async () => {
    const user = userEvent.setup();
    const { resolveConflict } = setup([{ taskId: "task-1", localTask, serverTask }]);
    render(<TaskConflictBanner />);

    await user.click(screen.getByRole("button", { name: "Use latest" }));

    expect(resolveConflict).toHaveBeenCalledWith("task-1", "keepServer");
  });

  it("renders nothing when there are no conflicts", () => {
    setup([]);
    const { container } = render(<TaskConflictBanner />);
    expect(container).toBeEmptyDOMElement();
  });
});
