import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="page-shell notfound-page">
      <div className="notfound">
        <div className="notfound__icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
            <line x1="8.5" y1="8.5" x2="13.5" y2="13.5" />
            <line x1="13.5" y1="8.5" x2="8.5" y2="13.5" />
          </svg>
        </div>

        <div className="notfound__code">404</div>
        <h1 className="notfound__title">This page doesn't exist</h1>
        <p className="notfound__text">
          The link might be broken, or the page may have moved. Let's get you back on track.
        </p>

        <Link to="/" className="notfound__cta">
          ← Back to boards
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;