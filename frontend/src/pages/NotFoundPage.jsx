// NotFoundPage.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AUTH_BG } from "../assets/cdn.js";

function NotFoundPage() {
  return (
    <motion.div
      className="page-shell bp2 notfound-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}
    >
      <div className="bp2-bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="bp2-bg-overlay" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--a" aria-hidden="true" />
      <div className="bp2-glow bp2-glow--b" aria-hidden="true" />

      <motion.div
        className="bp2-frame notfound-card"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ textAlign: "center", maxWidth: 460, width: "100%", padding: "48px 32px" }}
      >
        <div className="notfound__badge-wrap">
          <span className="notfound__badge-num">404</span>
        </div>

        <h1 className="notfound__heading">Page Not Found</h1>
        <p className="notfound__subtext">
          The page you are looking for doesn't exist or has been moved. Let's get you back to your workspace.
        </p>

        <div className="notfound__actions">
          <Link to="/dashboard" className="notfound__btn notfound__btn--primary">
            Go to Dashboard
          </Link>
          <Link to="/" className="notfound__btn notfound__btn--ghost">
            View Boards
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default NotFoundPage;