import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Calendar, Video, FileText, Users, Settings } from "lucide-react";
import logo from "../assets/Telestroke-logo.png";
import UserProfileBadge from "./UserProfileBadge";

const clinicianNav = [
  {
    label: "Home",
    items: [{ page: "DASHBOARD", to: "/dashboard", icon: LayoutDashboard, text: "Overview" }],
  },
  {
    label: "Workspace",
    items: [
      { page: "APPOINTMENTS", to: "/appointment", icon: Calendar, text: "Appointments" },
      { page: "PATIENTS", to: "/meeting", icon: Video, text: "Meeting" },
      { page: "EMR", to: "/emr", icon: FileText, text: "EMR Reports" },
    ],
  },
  {
    label: "System",
    items: [{ page: "SETTINGS", to: "/settings", icon: Settings, text: "Settings" }],
  },
];

const adminNav = [
  {
    label: "Home",
    items: [{ page: "DASHBOARD", to: "/dashboard", icon: LayoutDashboard, text: "Overview" }],
  },
  {
    label: "Management",
    items: [{ page: "USERS", to: "/userManagement", icon: Users, text: "Users" }],
  },
  {
    label: "System",
    items: [{ page: "SETTINGS", to: "/settings", icon: Settings, text: "Settings" }],
  },
];

const Sidebar = ({ page, variant = "user", isOpen, collapsed, onClose }) => {
  const groups = variant === "admin" ? adminNav : clinicianNav;

  return (
    <aside className={`ts-rail ${isOpen ? "is-open" : "is-collapsed"}`}>
      <div className="ts-rail-logo">
        <img src={logo} alt="Telestroke" />
      </div>
      <nav className="ts-rail-nav custom-scrollbar">
        {groups.map((group) => (
          <div className="ts-nav-group" key={group.label}>
            <div className="ts-nav-label">{group.label}</div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.page}
                  to={item.to}
                  onClick={onClose}
                  title={item.text}
                  className={`ts-nav-item ${page === item.page ? "is-active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{item.text}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="ts-rail-footer">
        <UserProfileBadge compact={collapsed} />
      </div>
    </aside>
  );
};

export default Sidebar;
