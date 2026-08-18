import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { label: "Board", to: "/", end: true },
  { label: "Dashboard", to: "/dashboard" },
  { label: "My Tasks", to: "/my-tasks" },
  { label: "Team", to: "/team" },
  { label: "Settings", to: "/settings" },
];

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar__logo">CollabBoard</div>
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default Sidebar;