import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import logo from "../assets/Telestroke-logo-mark.png";

const AppShell = ({
  page,
  title,
  subtitle,
  actions,
  children,
  variant = "user",
  dense = false,
  hideSidebar = false,
}) => {
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("tsRailOpen");
    if (saved === "0") return false;
    if (saved === "1") return true;
    return window.innerWidth > 768;
  });

  useEffect(() => {
    localStorage.setItem("tsRailOpen", railOpen ? "1" : "0");
  }, [railOpen]);

  const closeIfMobile = () => {
    if (window.innerWidth <= 768) setRailOpen(false);
  };

  return (
    <div
      className={`ts-shell ${!hideSidebar && !railOpen ? "is-rail-collapsed" : ""} ${dense ? "is-dense" : ""} ${hideSidebar ? "is-no-rail" : ""}`.trim()}
    >
      {!hideSidebar ? (
        <>
          <div
            className={`ts-overlay ${railOpen ? "is-open" : ""}`}
            onClick={() => setRailOpen(false)}
          />
          <Sidebar
            page={page}
            variant={variant}
            isOpen={railOpen}
            collapsed={!railOpen}
            onClose={closeIfMobile}
          />
        </>
      ) : null}
      <div className="ts-workspace">
        <header className="ts-topbar">
          <div className="flex items-center gap-3 min-w-0">
            {!hideSidebar ? (
              <button
                type="button"
                className="ts-btn-icon ts-rail-toggle"
                onClick={() => setRailOpen((open) => !open)}
                aria-label={railOpen ? "Collapse sidebar" : "Expand sidebar"}
                title={railOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu size={18} />
              </button>
            ) : (
              <img src={logo} alt="TeleStroke" className="ts-topbar-logo" />
            )}
            <div className="min-w-0">
              <h1 className="ts-topbar-title">{title}</h1>
              {subtitle ? <p className="ts-topbar-sub">{subtitle}</p> : null}
            </div>
          </div>
          <div className="ts-topbar-actions">
            <ThemeToggle />
            {actions}
          </div>
        </header>
        <main className="ts-main custom-scrollbar">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
