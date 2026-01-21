import React, { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import UserActivationModal from "../admin/UserActivationModal";
import RoleChangeModal from "../admin/RoleChangeModal";
import PostModerationModal from "../admin/PostModerationModal";

/**
 * Header component providing title area, global search, user avatar menu,
 * and an Admin modal trigger. Styled for a modern light look.
 */
// PUBLIC_INTERFACE
export default function Header() {
  /** App header bar with avatar menu and admin modal trigger. */
  const { user, logout } = useAuth?.() || { user: null, logout: () => {} };
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [actionModal, setActionModal] = useState(null); // "activation" | "role" | "moderation" | null
  const [contextUser] = useState({ id: "u-101", name: "John Admin", username: "john", active: true, role: "admin" });
  const [contextPost] = useState({ id: "p-204", title: "Example flagged post" });

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.isAdmin) return true;
    if (typeof user.role === "string" && user.role.toLowerCase() === "admin") return true;
    if (Array.isArray(user.roles) && user.roles.map(String).map(r => r.toLowerCase()).includes("admin")) return true;
    return false;
  }, [user]);

  const avatarInitials = useMemo(() => {
    const name = (user && (user.name || user.username || user.email)) || "User";
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [user]);

  const container = {
    height: 64,
    display: "flex",
    alignItems: "center",
    padding: "0 16px",
    backgroundColor: "var(--bg-secondary)",
    position: "relative",
  };

  const searchInput = {
    height: 36,
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    padding: "0 12px",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    minWidth: 240,
  };

  const primaryBtn = {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    backgroundColor: "#3B82F6",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  };

  const avatar = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid rgba(0,0,0,0.05)",
  };

  const dropdown = {
    position: "absolute",
    right: 16,
    top: 56,
    background: "var(--bg-primary)",
    border: `1px solid var(--border-color)`,
    borderRadius: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    minWidth: 200,
    zIndex: 50,
    overflow: "hidden",
  };

  const dropdownItem = {
    padding: "10px 12px",
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "var(--text-primary)",
  };

  return (
    <div style={container} role="banner">
      <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.2 }}>Analytics</div>
      <div style={{ flex: 1 }} />
      <div aria-label="Search" role="search">
        <input type="search" placeholder="Search…" aria-label="Search" style={searchInput} />
      </div>
      <div style={{ width: 12 }} />
      {isAdmin && (
        <button
          style={primaryBtn}
          aria-label="Open admin actions"
          onClick={() => setShowAdminModal(true)}
        >
          ⚙️ Admin
        </button>
      )}
      <div style={{ width: 12 }} />
      <div
        role="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setMenuOpen((o) => !o);
        }}
        tabIndex={0}
        style={avatar}
        title={user?.name || user?.username || "Account"}
      >
        {avatarInitials}
      </div>

      {menuOpen && (
        <div role="menu" aria-label="User menu" style={dropdown}>
          <div style={{ ...dropdownItem, fontWeight: 700, background: "var(--bg-secondary)" }}>
            <span>{user?.name || user?.username || "User"}</span>
            <span style={{ opacity: 0.6 }}>{isAdmin ? "Admin" : "Member"}</span>
          </div>
          <div
            style={dropdownItem}
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              // Placeholder for navigation to profile
              window.location.hash = "#/profiles";
            }}
          >
            Profile <span aria-hidden>👤</span>
          </div>
          <div
            style={dropdownItem}
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              // Placeholder for settings
              alert("Open Settings (to be wired)");
            }}
          >
            Settings <span aria-hidden>⚙️</span>
          </div>
          <div
            style={{ ...dropdownItem, color: "#EF4444" }}
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              logout && logout();
            }}
          >
            Logout <span aria-hidden>↩︎</span>
          </div>
        </div>
      )}

      {/* Admin Modal entry: choose a specific admin action */}
      {showAdminModal && (
        <div
          aria-modal="true"
          role="dialog"
          aria-label="Admin Actions"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
          onClick={() => setShowAdminModal(false)}
        >
          <div
            style={{
              width: "min(92vw, 520px)",
              background: "var(--bg-primary)",
              borderRadius: 14,
              border: `1px solid var(--border-color)`,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "14px 16px",
                fontWeight: 800,
                borderBottom: `1px solid var(--border-color)`,
                background: "var(--bg-secondary)",
              }}
            >
              Admin Actions
            </div>
            <div style={{ padding: 16, display: "grid", gap: 10 }}>
              <button
                style={primaryBtn}
                onClick={() => {
                  setActionModal("activation");
                  setShowAdminModal(false);
                }}
              >
                Toggle user activation
              </button>
              <button
                style={{ ...primaryBtn, backgroundColor: "#10B981" }}
                onClick={() => {
                  setActionModal("role");
                  setShowAdminModal(false);
                }}
              >
                Change user role
              </button>
              <button
                style={{ ...primaryBtn, backgroundColor: "#F59E0B" }}
                onClick={() => {
                  setActionModal("moderation");
                  setShowAdminModal(false);
                }}
              >
                Moderate post
              </button>
            </div>
            <div
              style={{
                padding: 12,
                borderTop: `1px solid var(--border-color)`,
                display: "flex",
                justifyContent: "flex-end",
                background: "var(--bg-secondary)",
              }}
            >
              <button
                style={{ ...primaryBtn, backgroundColor: "#6B7280" }}
                onClick={() => setShowAdminModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Concrete admin action modals */}
      {actionModal === "activation" && (
        <UserActivationModal
          isOpen={true}
          onClose={() => setActionModal(null)}
          user={contextUser}
        />
      )}
      {actionModal === "role" && (
        <RoleChangeModal
          isOpen={true}
          onClose={() => setActionModal(null)}
          user={contextUser}
        />
      )}
      {actionModal === "moderation" && (
        <PostModerationModal
          isOpen={true}
          onClose={() => setActionModal(null)}
          postItem={contextPost}
        />
      )}
    </div>
  );
}
