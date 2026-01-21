import React from "react";

/**
 * Right side Notifications/Activity panel.
 * Intended to list notifications, messages, and quick actions.
 */
// PUBLIC_INTERFACE
export default function NotificationsPanel() {
  /** Minimal notifications panel with placeholder items. */
  return (
    <div style={{ padding: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Notifications</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        <li
          style={{
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid var(--border-color)`,
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          New comment on Post #124
        </li>
        <li
          style={{
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid var(--border-color)`,
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          User Jane updated profile
        </li>
        <li
          style={{
            padding: "10px 12px",
            marginBottom: 8,
            borderRadius: 8,
            border: `1px solid var(--border-color)`,
            backgroundColor: "var(--bg-secondary)",
          }}
        >
          Moderation queue has 3 items
        </li>
      </ul>
    </div>
  );
}
