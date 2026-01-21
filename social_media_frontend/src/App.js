import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import NotificationsPanel from "./components/layout/NotificationsPanel";

import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import UserActivationModal from "./components/admin/UserActivationModal";
import RoleChangeModal from "./components/admin/RoleChangeModal";
import PostModerationModal from "./components/admin/PostModerationModal";

function ModerationPage() {
  const [items, setItems] = useState([
    { id: "p-1", title: "First flagged post" },
    { id: "p-2", title: "Suspicious link here" },
    { id: "p-3", title: "Spam promotion content" },
  ]);
  const [selected, setSelected] = useState(null);

  const panel = {
    border: `1px solid var(--border-color)`,
    borderRadius: 14,
    background: "var(--bg-primary)",
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    display: "grid",
    gap: 10,
    maxWidth: 720,
  };
  const row = {
    border: `1px solid var(--border-color)`,
    borderRadius: 10,
    padding: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };
  const btn = {
    height: 32,
    padding: "0 10px",
    borderRadius: 8,
    border: `1px solid var(--border-color)`,
    background: "#F59E0B",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "16px", display: "grid", gap: 12 }}>
      <h2>Moderation</h2>
      <p>Moderate content and handle admin actions.</p>

      <section style={panel} aria-label="Moderation queue">
        {items.map((it) => (
          <div key={it.id} style={row}>
            <div style={{ fontWeight: 700 }}>{it.title}</div>
            <button style={btn} onClick={() => setSelected(it)}>Review</button>
          </div>
        ))}
      </section>

      <PostModerationModal
        isOpen={Boolean(selected)}
        onClose={(res) => {
          if (res?.success) {
            // Example: remove from list after action
            setItems((l) => l.filter((x) => x.id !== selected.id));
          }
          setSelected(null);
        }}
        postItem={selected || {}}
      />
    </div>
  );
}

function AdminPage() {
  const [showActivation, setShowActivation] = useState(false);
  const [showRoleChange, setShowRoleChange] = useState(false);
  const [showPostModeration, setShowPostModeration] = useState(false);

  const [selectedUser, setSelectedUser] = useState({
    id: "u-101",
    name: "John Admin",
    username: "john",
    active: true,
    role: "admin",
  });

  const [selectedPost, setSelectedPost] = useState({
    id: "p-204",
    title: "Example flagged post",
  });

  const label = { fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.65)" };
  const input = {
    width: "100%",
    height: 36,
    padding: "0 10px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
  };
  const panel = {
    border: `1px solid var(--border-color)`,
    borderRadius: 14,
    background: "var(--bg-primary)",
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    display: "grid",
    gap: 10,
    maxWidth: 640,
  };
  const button = {
    height: 36,
    padding: "0 12px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "#3B82F6",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
  };

  return (
    <div style={{ padding: "16px", display: "grid", gap: 12 }}>
      <h2>Admin</h2>
      <p>Admin configuration and tools. (To be wired with auth guard)</p>

      <section style={panel} aria-label="Admin actions">
        <div style={{ fontWeight: 800 }}>Quick actions</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label htmlFor="adm_u" style={label}>User</label>
            <input
              id="adm_u"
              style={input}
              value={selectedUser.username}
              onChange={(e) =>
                setSelectedUser((u) => ({ ...u, username: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="adm_p" style={label}>Post title</label>
            <input
              id="adm_p"
              style={input}
              value={selectedPost.title}
              onChange={(e) =>
                setSelectedPost((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={button} onClick={() => setShowActivation(true)}>
            Toggle user activation
          </button>
          <button style={button} onClick={() => setShowRoleChange(true)}>
            Change user role
          </button>
          <button style={{ ...button, background: "#F59E0B" }} onClick={() => setShowPostModeration(true)}>
            Moderate post
          </button>
        </div>
      </section>

      <UserActivationModal
        isOpen={showActivation}
        onClose={(res) => {
          setShowActivation(false);
          if (res?.success) {
            setSelectedUser((u) => ({ ...u, active: res.active }));
          }
        }}
        user={selectedUser}
      />

      <RoleChangeModal
        isOpen={showRoleChange}
        onClose={(res) => {
          setShowRoleChange(false);
          if (res?.success) {
            setSelectedUser((u) => ({ ...u, role: res.role }));
          }
        }}
        user={selectedUser}
      />

      <PostModerationModal
        isOpen={showPostModeration}
        onClose={() => setShowPostModeration(false)}
        postItem={selectedPost}
      />
    </div>
  );
}

// PUBLIC_INTERFACE
export default function App() {
  /** App entry that wires BrowserRouter and the main layout skeleton. */
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const layoutStyles = useMemo(
    () => ({
      appShell: {
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "260px 1fr 340px",
        gridTemplateRows: "64px 1fr",
        gridTemplateAreas: `
          "sidebar header header"
          "sidebar main notifications"
        `,
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      },
      sidebarArea: { gridArea: "sidebar", borderRight: `1px solid var(--border-color)`, minHeight: "100%" },
      headerArea: { gridArea: "header", borderBottom: `1px solid var(--border-color)` },
      mainArea: {
        gridArea: "main",
        minHeight: "calc(100vh - 64px)",
        overflow: "auto",
        backgroundColor: "var(--bg-secondary)",
      },
      rightPanelArea: {
        gridArea: "notifications",
        borderLeft: `1px solid var(--border-color)`,
        minHeight: "calc(100vh - 64px)",
        overflow: "auto",
        backgroundColor: "var(--bg-primary)",
      },
      themeToggle: {
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 20,
      },
    }),
    []
  );

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App" style={layoutStyles.appShell}>
          <aside style={layoutStyles.sidebarArea}>
            <Sidebar />
          </aside>

          <header style={layoutStyles.headerArea}>
            <Header />
          </header>

          <main style={layoutStyles.mainArea} role="main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/profiles" element={<Profile />} />
              <Route path="/moderation" element={<ModerationPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <section style={layoutStyles.rightPanelArea} aria-label="Notifications and Activity">
            <NotificationsPanel />
          </section>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            style={layoutStyles.themeToggle}
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </button>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
