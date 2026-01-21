import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";
import { post } from "../../api/client";

/**
 * Modal to change a user's role.
 * Prepped for backend integration: POST /admin/users/:id/role with { role }
 */
// PUBLIC_INTERFACE
export default function RoleChangeModal({ isOpen, onClose, user }) {
  /** Admin dialog to change the role for a user. */
  const initialRole =
    (Array.isArray(user?.roles) && String(user.roles[0] || "")) ||
    String(user?.role || "member");
  const [role, setRole] = useState(initialRole.toLowerCase());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

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
  const row = { display: "grid", gap: 8 };
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

  const onSubmit = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await post(`/admin/users/${encodeURIComponent(user?.id || "")}/role`, { role });
      setToast("Role updated");
      setTimeout(() => {
        setToast(null);
        onClose && onClose({ success: true, role });
      }, 800);
    } catch (e) {
      setToast((e && (e.data?.message || e.message)) || "Failed to update role");
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose && onClose(null)}
      title={`Change role for ${user?.name || user?.username || "user"}`}
      size="sm"
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
        <label style={label} htmlFor="rc_role">
          Role
        </label>
        <select
          id="rc_role"
          style={input}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          autoFocus
        >
          <option value="member">Member</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
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

RoleChangeModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    username: PropTypes.string,
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    roles: PropTypes.array,
  }),
};
