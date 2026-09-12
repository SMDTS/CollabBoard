import { useState } from "react";
import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Gauge, CheckSquare, Users, Settings, ChevronLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { LOGO_ICON, AUTH_BG } from "../assets/cdn.js";
import UserAvatar from "./UserAvatar.jsx";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", Icon: Gauge },
  { label: "Boards", to: "/", end: true, Icon: LayoutGrid },
  { label: "My Tasks", to: "/my-tasks", Icon: CheckSquare },
  { label: "Team", to: "/team", Icon: Users },
];

const SPRING = { type: "spring", stiffness: 350, damping: 30 };
const LABEL_TRANSITION = { duration: 0.15 };

function NavLabel({ show, children }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          transition={LABEL_TRANSITION}
          className="sidebar__label"
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function Tooltip({ show, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 8, scale: 0.95 }}
          animate={{ opacity: 1, x: 18, scale: 1 }}
          exit={{ opacity: 0, x: 8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="sidebar__tooltip"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const { user } = useAuth();
  const expanded = !collapsed || hovering;

  return (
    <motion.div
      className={`sidebar ${!expanded ? "sidebar--collapsed" : ""}`}
      initial={false}
      animate={{ width: expanded ? 208 : 60 }}
      transition={SPRING}
      onMouseEnter={() => collapsed && setHovering(true)}
      onMouseLeave={() => {
        setHovering(false);
        setHoveredTooltip(null);
      }}
    >
      <div className="sidebar__bg" style={{ backgroundImage: `url(${AUTH_BG})` }} aria-hidden="true" />
      <div className="sidebar__bg-overlay" aria-hidden="true" />
      <div className="sidebar__top">
        <div className="sidebar__brand">
          <motion.img
            src={LOGO_ICON}
            alt=""
            whileHover={{ rotate: 12, scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="sidebar__brand-mark"
          />
          <NavLabel show={expanded}>
            <span className="sidebar__logo">Flowty</span>
          </NavLabel>
        </div>

        {/* Hidden while collapsed-and-not-hovering — it was sitting right
            on top of the logo mark in that state with nowhere to go.
            Hovering (which expands the sidebar for a preview) or clicking
            to pin it open both bring the toggle back. */}
        <AnimatePresence>
          {expanded && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="sidebar__toggle"
              onClick={() => setCollapsed((prev) => !prev)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
            >
              <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={SPRING}>
                <ChevronLeft size={14} strokeWidth={2.5} />
              </motion.div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ label, to, end, Icon }) => (
          <div key={label} className="sidebar__link-wrap">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
              title={!expanded ? label : undefined}
              onMouseEnter={() => !expanded && setHoveredTooltip(label)}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div layoutId="sidebarActivePill" className="sidebar__active-pill" transition={SPRING} />
                  )}
                  <motion.span whileHover={{ scale: 1.15 }} className="sidebar__icon">
                    <Icon size={16} strokeWidth={isActive ? 2.4 : 2} />
                  </motion.span>
                  <NavLabel show={expanded}>{label}</NavLabel>
                </>
              )}
            </NavLink>
            <Tooltip show={!expanded && hoveredTooltip === label}>{label}</Tooltip>
          </div>
        ))}
      </nav>

      <nav className="sidebar__nav sidebar__nav--bottom">
        <div className="sidebar__link-wrap">
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
            title={!expanded ? "Settings" : undefined}
            onMouseEnter={() => !expanded && setHoveredTooltip("Settings")}
            onMouseLeave={() => setHoveredTooltip(null)}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div layoutId="sidebarActivePill" className="sidebar__active-pill" transition={SPRING} />
                )}
                <motion.span whileHover={{ rotate: 45 }} transition={{ type: "spring", stiffness: 300 }} className="sidebar__icon">
                  <Settings size={16} strokeWidth={2} />
                </motion.span>
                <NavLabel show={expanded}>Settings</NavLabel>
              </>
            )}
          </NavLink>
          <Tooltip show={!expanded && hoveredTooltip === "Settings"}>Settings</Tooltip>
        </div>

        <div className="sidebar__profile">
          <UserAvatar user={user} size={28} className="sidebar__profile-avatar" />
          <NavLabel show={expanded}>
            <div className="sidebar__profile-info">
              <div className="sidebar__profile-name">{user?.name || "Account"}</div>
              <div className="sidebar__profile-email">{user?.email || ""}</div>
            </div>
          </NavLabel>
        </div>
      </nav>
    </motion.div>
  );
}

export default Sidebar;