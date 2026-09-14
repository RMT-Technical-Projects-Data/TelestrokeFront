import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";
import ConfirmModal from "./ConfirmModal";

const AppShell = ({
  page,
  title,
  subtitle,
  actions,
  children,
  variant = "user",
  dense = false,
  examLayout = false,
  lockNavigation = false,
  defaultRailOpen,
}) => {
  const navigate = useNavigate();
  const wasLocked = useRef(false);
  const [pendingLeave, setPendingLeave] = useState(null);
  const [railOpen, setRailOpen] = useState(() => {
    if (typeof defaultRailOpen === "boolean") return defaultRailOpen;
    if (typeof window === "undefined") return true;
    const saved = localStorage.getItem("tsRailOpen");
    if (saved === "0") return false;
    if (saved === "1") return true;
    return window.innerWidth > 768;
  });

  useEffect(() => {
    if (typeof defaultRailOpen === "boolean") {
      setRailOpen(defaultRailOpen);
    }
  }, [defaultRailOpen]);

  useEffect(() => {
    localStorage.setItem("tsRailOpen", railOpen ? "1" : "0");
  }, [railOpen]);

  useEffect(() => {
    if (wasLocked.current && !lockNavigation) {
      setRailOpen(true);
      localStorage.setItem("tsRailOpen", "1");
    }
    wasLocked.current = lockNavigation;
  }, [lockNavigation]);

  const closeIfMobile = () => {
    if (window.innerWidth <= 768) setRailOpen(false);
  };

  const requestLeave = (target) => {
    setPendingLeave(target);
  };

  const confirmLeave = () => {
    const target = pendingLeave;
    setPendingLeave(null);
    if (!target) return;

    setRailOpen(true);
    localStorage.setItem("tsRailOpen", "1");

    if (target.type === "signout") {
      localStorage.removeItem("token");
      localStorage.removeItem("Doctor");
      localStorage.removeItem("role");
      sessionStorage.removeItem("tsOverdueToastShown");
      toast.dismiss();
      navigate("/login");
      return;
    }

    navigate(target.to);
  };

  return (
    <div
      className={`ts-shell ${railOpen ? "" : "is-rail-collapsed"} ${dense ? "is-dense" : ""} ${examLayout ? "is-exam" : ""}`.trim()}
    >
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
        lockNavigation={lockNavigation}
        onRequestLeave={requestLeave}
      />
      <div className="ts-workspace">
        <header className="ts-topbar">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="ts-btn-icon ts-rail-toggle"
              onClick={() => setRailOpen((open) => !open)}
              aria-label={railOpen ? "Collapse sidebar" : "Expand sidebar"}
              title={railOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu size={18} />
            </button>
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
      <ConfirmModal
        isOpen={Boolean(pendingLeave)}
        onClose={() => setPendingLeave(null)}
        onConfirm={confirmLeave}
        title="Leave meeting?"
        message="Are you sure you want to leave the meeting?"
        confirmLabel="Leave meeting"
        danger
      />
    </div>
  );
};

export default AppShell;
