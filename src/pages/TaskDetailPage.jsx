import { useParams } from "react-router-dom";

function TaskDetailPage() {
  const { id } = useParams();
  return (
    <div className="page-placeholder">
      <h1>Task Detail</h1>
      <p>Dummy page — build the card editor here. URL param id: {id}</p>
    </div>
  );
}

export default TaskDetailPage;