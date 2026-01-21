import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Sidebar component for app-wide navigation with icons and active state.
 * Modern light style using CSS variables and inline styles for simplicity.
 */
// PUBLIC_INTERFACE
export default function Sidebar() {
  /** App navigation sidebar with links to core sections and conditional Admin link. */
  const { user } = useAuth?.() || { user: null };

  // Placeholder admin check; ready to be wired to real user roles/claims.
  const isAdmin = useMemo(() => {
    if (!user) return false;
    // Allows: user.isAdmin === true OR role === 'admin' OR roles array contains 'admin'
    if (user.isAdmin) return true;
    if (typeof user.role === "string" && user.role.toLowerCase() === "admin") return true;
    if (Array.isArray(user.roles) && user.roles.map(String).map(r => r.toLowerCase()).includes("admin")) return true;
    return false;
  }, [user]);

  const baseLinkStyle = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    textDecoration: "none",
    borderRadius: 10,
    margin: "4px 8px",
    fontWeight: 600,
    transition: "background 0.2s ease, color 0.2s ease",
    border: `1px solid transparent`,
  };

  const linkStyle = ({ isActive }) => ({
    ...baseLinkStyle,
    color: isActive ? "#3B82F6" : "var(--text-primary)",
    backgroundColor: isActive ? "rgba(59,130,246,0.08)" : "transparent",
    borderColor: isActive ? "#e5efff" : "transparent",
  });

  const sectionStyle = {
    padding: 12,
    height: "100%",
    backgroundColor: "var(--bg-primary)",
    display: "flex",
    flexDirection: "column",
  };

  const brandRow = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px",
    fontWeight: 800,
    fontSize: 18,
    color: "var(--text-primary)",
  };

  const brandBadge = {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: 800,
  };

  const iconStyle = {
    width: 18,
    height: 18,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <nav aria-label="Primary" style={sectionStyle}>
      <div style={brandRow}>
        <span style={brandBadge}>S</span>
        <span>Social Dashboard</span>
      </div>

      <div style={{ height: 6 }} />
      <div role="list" aria-label="Main navigation" style={{ display: "flex", flexDirection: "column" }}>
        <NavLink to="/" style={linkStyle} end aria-label="Dashboard">
          <span style={iconStyle} aria-hidden>📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/profiles" style={linkStyle} aria-label="Profiles">
          <span style={iconStyle} aria-hidden>👤</span>
          <span>Profiles</span>
        </NavLink>

        {/* Visible for all for now; can guard route separately. */}
        <NavLink to="/moderation" style={linkStyle} aria-label="Moderation">
          <span style={iconStyle} aria-hidden>🛡️</span>
          <span>Moderation</span>
        </NavLink>

        {isAdmin && (
          <NavLink to="/admin" style={linkStyle} aria-label="Admin">
            <span style={iconStyle} aria-hidden>⚙️</span>
            <span>Admin</span>
          </NavLink>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div aria-hidden style={{ padding: "8px 12px", color: "rgba(0,0,0,0.45)", fontSize: 12 }}>
        v0.1 • Light
      </div>
    </nav>
  );
}
