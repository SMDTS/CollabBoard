import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="page-placeholder">
      <h1>404 — Page not found</h1>
      <Link to="/">← Back to Board</Link>
    </div>
  );
}

export default NotFoundPage;
