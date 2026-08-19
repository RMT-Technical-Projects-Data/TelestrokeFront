import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const getStoredTheme = () =>
  typeof window !== "undefined" && localStorage.getItem("tsTheme") === "dark"
    ? "dark"
    : "light";

export const applyTheme = (theme) => {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("tsTheme", next);
  window.dispatchEvent(new CustomEvent("ts-theme", { detail: next }));
  return next;
};

const ThemeToggle = ({ className = "" }) => {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onTheme = (event) => {
      if (event.detail === "dark" || event.detail === "light") setTheme(event.detail);
    };
    window.addEventListener("ts-theme", onTheme);
    return () => window.removeEventListener("ts-theme", onTheme);
  }, []);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <button
      type="button"
      className={`ts-btn-icon ${className}`.trim()}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light theme" : "Dark theme"}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
};

export default ThemeToggle;
