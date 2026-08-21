import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

const AppShell = ({ page, title, subtitle, actions, children, variant = "user", dense = false, lockRail = false }) => {
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("tsRailOpen");
    if (saved === "0") return false;
    if (saved === "1") return true;
    return window.innerWidth > 768;
  });

  useEffect(() => {
    if (lockRail) return;
    localStorage.setItem("tsRailOpen", railOpen ? "1" : "0");
  }, [railOpen, lockRail]);

  const closeIfMobile = () => {
    if (window.innerWidth <= 768) setRailOpen(false);
  };

  const effectiveOpen = lockRail ? false : railOpen;

  return (
    <div className={`ts-shell ${effectiveOpen ? "" : "is-rail-collapsed"} ${dense ? "is-dense" : ""} ${lockRail ? "is-rail-locked is-exam-live" : ""}`.trim()}>
      <div
        className={`ts-overlay ${effectiveOpen ? "is-open" : ""}`}
        onClick={() => setRailOpen(false)}
      />
      <Sidebar
        page={page}
        variant={variant}
        isOpen={effectiveOpen}
        collapsed={!effectiveOpen}
        locked={lockRail}
        onClose={closeIfMobile}
      />
      <div className="ts-workspace">
        <header className="ts-topbar">
          <div className="flex items-start gap-3 min-w-0">
            {!lockRail && (
              <button
                type="button"
                className="ts-btn-icon ts-rail-toggle"
                onClick={() => setRailOpen((open) => !open)}
                aria-label={railOpen ? "Collapse sidebar" : "Expand sidebar"}
                title={railOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <Menu size={18} />
              </button>
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
