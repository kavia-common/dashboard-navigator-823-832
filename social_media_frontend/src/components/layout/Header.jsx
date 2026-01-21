import React from "react";

/**
 * Header component providing title area, search, and placeholder user actions.
 */
// PUBLIC_INTERFACE
export default function Header() {
  /** App header bar. */
  return (
    <div
      style={{
        height: 64,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        backgroundColor: "var(--bg-secondary)",
      }}
      role="banner"
    >
      <div style={{ fontWeight: 700, fontSize: 18 }}>Analytics</div>
      <div style={{ flex: 1 }} />
      <div aria-label="Search" role="search">
        <input
          type="search"
          placeholder="Search…"
          aria-label="Search"
          style={{
            height: 36,
            borderRadius: 8,
            border: `1px solid var(--border-color)`,
            padding: "0 12px",
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <div style={{ width: 12 }} />
      <button
        style={{
          height: 36,
          padding: "0 12px",
          borderRadius: 8,
          border: `1px solid var(--border-color)`,
          backgroundColor: "var(--button-bg)",
          color: "var(--button-text)",
          fontWeight: 600,
        }}
        aria-label="New action"
      >
        + New
      </button>
    </div>
  );
}
