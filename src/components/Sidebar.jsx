import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutGrid, Gauge, CheckSquare, Users, Settings, ChevronLeft } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", Icon: Gauge },
  { label: "Boards", to: "/", end: true, Icon: LayoutGrid },
  { label: "My Tasks", to: "/my-tasks", Icon: CheckSquare },
  { label: "Team", to: "/team", Icon: Users },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__top">
        {!collapsed && <div className="sidebar__logo">Flowty</div>}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <ChevronLeft size={14} strokeWidth={2.5} style={{ transform: collapsed ? "rotate(180deg)" : "none" }} />
        </button>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map(({ label, to, end, Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
            title={collapsed ? label : undefined}
          >
            <span className="sidebar__icon">
              <Icon size={16} strokeWidth={2} />
            </span>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <nav className="sidebar__nav sidebar__nav--bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
          title={collapsed ? "Settings" : undefined}
        >
          <span className="sidebar__icon">
            <Settings size={16} strokeWidth={2} />
          </span>
          {!collapsed && <span>Settings</span>}
        </NavLink>
      </nav>
    </div>
  );
}

export default Sidebar;