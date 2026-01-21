import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Sidebar component for app-wide navigation.
 * Provides minimal styling and active link indication.
 */
// PUBLIC_INTERFACE
export default function Sidebar() {
  /** App navigation sidebar with links to core sections. */
  const linkStyle = ({ isActive }) => ({
    display: "block",
    padding: "12px 16px",
    textDecoration: "none",
    color: isActive ? "var(--text-secondary)" : "var(--text-primary)",
    backgroundColor: isActive ? "var(--bg-secondary)" : "transparent",
    borderRadius: 8,
    margin: "4px 8px",
    fontWeight: isActive ? 700 : 500,
  });

  return (
    <nav aria-label="Primary" style={{ padding: 12 }}>
      <div style={{ padding: "8px 12px", fontWeight: 800, fontSize: 18 }}>
        Social Dashboard
      </div>
      <div style={{ height: 8 }} />
      <NavLink to="/" style={linkStyle} end>
        Dashboard
      </NavLink>
      <NavLink to="/profiles" style={linkStyle}>
        Profiles
      </NavLink>
      <NavLink to="/moderation" style={linkStyle}>
        Moderation
      </NavLink>
    </nav>
  );
}
