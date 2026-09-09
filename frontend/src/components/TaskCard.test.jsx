// frontend/src/components/TaskCard.test.jsx
import { render, screen } from "@testing-library/react";
import TaskCard from "./TaskCard";

describe("TaskCard", () => {
  it("renders the task title", () => {
    render(<TaskCard id="1" title="Write tests" assignee="Sarah" dueDate="Sep 12" columnTitle="To Do" canDrag />);
    expect(screen.getByText("Write tests")).toBeInTheDocument();
  });
});