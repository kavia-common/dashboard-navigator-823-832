import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import Modal from "../components/common/Modal";
import { AuthProvider } from "../context/AuthContext";

// Helper to render app shell
const renderWithProviders = (ui, { route = "/" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe("Sidebar accessibility and links", () => {
  test("has aria-labels for navigation and shows key links", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/"]}>
        <Sidebar />
      </MemoryRouter>
    );
    // Navigation landmark
    expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
    // Main list aria-label
    expect(screen.getByRole("list", { name: /main navigation/i })).toBeInTheDocument();

    // Links by aria-label/text
    expect(screen.getByRole("link", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /profiles/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /moderation/i })).toBeInTheDocument();
  });
});

describe("Header accessibility", () => {
  test("has search landmark and button with aria-label", () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/"]}>
        <Header />
      </MemoryRouter>
    );
    expect(screen.getByRole("search", { name: /search/i })).toBeInTheDocument();
    // Avatar is a button-ish div with role button and menu semantics exposed; ensure it's present
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("Modal accessibility behavior", () => {
  test("renders dialog with aria-modal and close button", () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test Dialog">
        <button>Focusable</button>
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: /test dialog/i });
    expect(dialog).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /close dialog/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});

describe("Main App pages basic rendering and landmarks", () => {
  beforeEach(() => {
    // mock fetch for dashboard and profile API calls
    global.fetch = jest.fn(async (url, opts) => {
      const path = typeof url === "string" ? url : "";
      if (path.includes("/analytics/summary")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({
            totalUsers: 1200,
            newUsers24h: 12,
            activeUsers: 340,
            activeUsersChange: 5,
            totalPosts: 4800,
            posts24h: 34,
            engagementRate: 12.5,
            engagementChange: -1.2,
          }),
          text: async () => "",
        };
      }
      if (path.includes("/analytics/daily")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => Array.from({ length: 10 }, (_, i) => ({ date: `D${i + 1}`, value: i * 3 + 1 })),
          text: async () => "",
        };
      }
      if (path.includes("/profile/me") && (!opts || opts.method === "GET")) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ id: "u1", name: "Alice", username: "alice", email: "alice@example.com" }),
          text: async () => "",
        };
      }
      if (path.includes("/profile/me") && opts && opts.method === "PUT") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ ...JSON.parse(opts.body) }),
          text: async () => "",
        };
      }
      // default
      return {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({}),
        text: async () => "",
      };
    });
  });

  test("App shell renders with main role and notifications aria section", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // main landmark
    expect(screen.getByRole("main")).toBeInTheDocument();
    // Notifications panel section
    expect(screen.getByRole("region", { name: /notifications and activity/i })).toBeInTheDocument();
    // Theme toggle button with aria-label present
    const toggle = screen.getByRole("button", { name: /switch to dark mode/i });
    expect(toggle).toBeInTheDocument();
  });

  test("Dashboard loads summary and chart landmark", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );
    // Wait for the Daily Activity section
    expect(await screen.findByRole("region", { name: /analytics trends/i })).toBeInTheDocument();
    // Summary cards section exists
    expect(screen.getByRole("region", { name: /summary cards/i })).toBeInTheDocument();
  });

  test("Profile route renders profile form section", async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={["/profiles"]}>
        <App />
      </MemoryRouter>
    );
    // Section with aria-label "Profile form"
    expect(await screen.findByRole("region", { name: /profile form/i })).toBeInTheDocument();
    // Name field should be populated from API mock
    expect(screen.getByLabelText(/name/i)).toHaveValue("Alice");
  });
});
