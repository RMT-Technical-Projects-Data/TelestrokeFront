import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Calendar, FileText, LayoutDashboard, Lock, Moon, Shield, Sun, Users, Video } from "lucide-react";
import { toast } from "react-toastify";
import AppShell from "../components/AppShell";
import { getApiBaseUrl } from "../api/client";
import { applyTheme, getStoredTheme } from "../components/ThemeToggle";

const CLINICIAN_SHORTCUTS = [
  { to: "/appointment", icon: Calendar, title: "Appointments", sub: "Schedule and join sessions" },
  { to: "/meeting", icon: Video, title: "Meeting", sub: "Start an instant exam" },
  { to: "/emr", icon: FileText, title: "EMR reports", sub: "Review examination records" },
];

const ADMIN_SHORTCUTS = [
  { to: "/dashboard", icon: LayoutDashboard, title: "Overview", sub: "Caseload and appointment mix" },
  { to: "/userManagement", icon: Users, title: "Users", sub: "Create and manage clinicians" },
];

const Settings = () => {
  const displayName = localStorage.getItem("Doctor") || "User";
  const role = localStorage.getItem("role") || "user";
  const roleLabel = role === "admin" ? "Administrator" : "Clinician";
  const variant = role === "admin" ? "admin" : "user";
  const initial = String(displayName).charAt(0).toUpperCase();

  const [overdueAlerts, setOverdueAlerts] = useState(
    localStorage.getItem("tsOverdueAlerts") !== "off"
  );
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    const onTheme = (event) => {
      if (event.detail === "dark" || event.detail === "light") setTheme(event.detail);
    };
    window.addEventListener("ts-theme", onTheme);
    return () => window.removeEventListener("ts-theme", onTheme);
  }, []);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);
  const shortcuts = role === "admin" ? ADMIN_SHORTCUTS : CLINICIAN_SHORTCUTS;

  const toggleAlerts = () => {
    const next = !overdueAlerts;
    setOverdueAlerts(next);
    localStorage.setItem("tsOverdueAlerts", next ? "on" : "off");
    toast.success(next ? "Overdue reminders enabled." : "Overdue reminders disabled.");
  };

  const toggleTheme = () => {
    const next = applyTheme(theme === "dark" ? "light" : "dark");
    setTheme(next);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 16) {
      toast.error("Password must be 8–16 characters.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Failed to update password");
      toast.success(data.message || "Password updated.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      variant={variant}
      page="SETTINGS"
      title="Settings"
      subtitle="Account, alerts, and workspace preferences."
    >
      <div className="ts-stack">
        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">Account</h3>
            <span className="ts-panel-meta">Signed-in profile</span>
          </div>
          <div className="ts-settings-body">
            <div className="ts-settings-profile">
              <div className="ts-avatar" style={{ width: 52, height: 52, fontSize: "1.15rem" }}>
                {initial}
              </div>
              <div>
                <strong style={{ display: "block" }}>{displayName}</strong>
                <span className="ts-muted" style={{ display: "block", marginTop: 2 }}>{roleLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="ts-settings-two">
          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Notifications</h3>
              <span className="ts-panel-meta">Reminders</span>
            </div>
            <div className="ts-settings-body">
              <div className="ts-settings-row">
                <div>
                  <div className="ts-settings-row-title"><Bell size={15} /> Overdue appointments</div>
                  <p className="ts-settings-row-sub">Show a reminder on Overview when sessions are past due.</p>
                </div>
                <button type="button" className="ts-btn ts-btn-ghost" onClick={toggleAlerts}>
                  {overdueAlerts ? "On" : "Off"}
                </button>
              </div>
              <div className="ts-settings-row" style={{ marginTop: "1rem" }}>
                <div>
                  <div className="ts-settings-row-title">
                    {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />} Appearance
                  </div>
                  <p className="ts-settings-row-sub">Switch between light and dark workspace theme.</p>
                </div>
                <button type="button" className="ts-btn ts-btn-ghost" onClick={toggleTheme}>
                  {theme === "dark" ? "Dark" : "Light"}
                </button>
              </div>
            </div>
          </div>

          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Security</h3>
              <span className="ts-panel-meta">Password</span>
            </div>
            <div className="ts-settings-body">
              <form onSubmit={handlePassword}>
                <div className="ts-field">
                  <label>Current password</label>
                  <input type="password" className="ts-input" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                </div>
                <div className="ts-field">
                  <label>New password</label>
                  <input type="password" className="ts-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
                <div className="ts-field">
                  <label>Confirm password</label>
                  <input type="password" className="ts-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                <button type="submit" className="ts-btn ts-btn-primary" disabled={saving}>
                  <Lock size={15} /> {saving ? "Saving..." : "Update password"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">Workspace</h3>
            <span className="ts-panel-meta">Quick links</span>
          </div>
          <div className="ts-settings-body">
            <div className="ts-settings-shortcuts">
              {shortcuts.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} className="ts-settings-shortcut">
                    <Icon size={18} />
                    <span>
                      <strong>{item.title}</strong>
                      <em>{item.sub}</em>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">About</h3>
            <span className="ts-panel-meta">TeleStroke</span>
          </div>
          <div className="ts-settings-body">
            <div className="ts-settings-row">
              <div>
                <div className="ts-settings-row-title"><Shield size={15} /> Remote Eyestroke Web App</div>
                <p className="ts-settings-row-sub">
                  Clinical workspace for appointments, live meetings, and EMR reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
