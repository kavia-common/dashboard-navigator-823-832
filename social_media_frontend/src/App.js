import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import NotificationsPanel from "./components/layout/NotificationsPanel";

// Lightweight placeholder pages to demonstrate routing expansion
function DashboardHome() {
  return (
    <div style={{ padding: "16px" }}>
      <h2>Dashboard</h2>
      <p>Welcome to your social media analytics dashboard.</p>
    </div>
  );
}

function ProfilesPage() {
  return (
    <div style={{ padding: "16px" }}>
      <h2>Profiles</h2>
      <p>Manage and view user profiles here.</p>
    </div>
  );
}

function ModerationPage() {
  return (
    <div style={{ padding: "16px" }}>
      <h2>Moderation</h2>
      <p>Moderate content and handle admin actions.</p>
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
              <Route path="/" element={<DashboardHome />} />
              <Route path="/profiles" element={<ProfilesPage />} />
              <Route path="/moderation" element={<ModerationPage />} />
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
