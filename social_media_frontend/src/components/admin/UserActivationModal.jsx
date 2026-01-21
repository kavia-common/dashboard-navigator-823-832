import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";
import { post } from "../../api/client";

/**
 * Modal to activate/deactivate a user with reason.
 * Prepped for backend integration: POST /admin/users/:id/activate with { active, reason }
 */
// PUBLIC_INTERFACE
export default function UserActivationModal({ isOpen, onClose, user }) {
  /** Admin dialog to toggle user activation state. */
  const [active, setActive] = useState(Boolean(user?.active));
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const primaryBtn = {
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "#3B82F6",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  };
  const secondaryBtn = {
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontWeight: 700,
    cursor: "pointer",
  };
  const input = {
    width: "100%",
    height: 36,
    padding: "0 10px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
  };
  const textarea = {
    width: "100%",
    minHeight: 80,
    padding: "8px 10px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    resize: "vertical",
  };
  const label = { fontSize: 12, fontWeight: 700, color: "rgba(0,0,0,0.65)" };
  const row = { display: "grid", gap: 8 };

  const onSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Backend endpoint example; adjust path as needed.
      await post(`/admin/users/${encodeURIComponent(user?.id || "")}/activate`, {
        active,
        reason: reason || undefined,
      });
      setToast("Saved");
      setTimeout(() => {
        setToast(null);
        onClose && onClose({ success: true, active });
      }, 800);
    } catch (e) {
      setToast((e && (e.data?.message || e.message)) || "Failed to save");
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose && onClose(null)}
      title={`Set ${user?.name || user?.username || "user"} status`}
      size="md"
    >
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: 8,
            borderRadius: 8,
            border: `1px solid var(--border-color)`,
            background: "var(--bg-primary)",
            fontWeight: 700,
          }}
        >
          {toast}
        </div>
      )}
      <div style={row}>
        <label style={label} htmlFor="ua_status">
          Status
        </label>
        <select
          id="ua_status"
          style={input}
          value={active ? "active" : "inactive"}
          onChange={(e) => setActive(e.target.value === "active")}
          autoFocus
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive (suspended)</option>
        </select>
      </div>

      <div style={row}>
        <label style={label} htmlFor="ua_reason">
          Reason (optional)
        </label>
        <textarea
          id="ua_reason"
          style={textarea}
          placeholder="Add context for this action"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button style={secondaryBtn} onClick={() => onClose && onClose(null)} disabled={saving}>
          Cancel
        </button>
        <button style={primaryBtn} onClick={onSubmit} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Modal>
  );
}

UserActivationModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    active: PropTypes.bool,
  }),
};
