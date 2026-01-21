import React, { useState } from "react";
import PropTypes from "prop-types";
import Modal from "../common/Modal";
import { post } from "../../api/client";

/**
 * Modal to moderate a post (approve/remove) with note.
 * Prepped for backend integration:
 * - POST /admin/posts/:id/approve  { note? }
 * - POST /admin/posts/:id/remove   { note? }
 */
// PUBLIC_INTERFACE
export default function PostModerationModal({ isOpen, onClose, postItem }) {
  /** Admin dialog to moderate a post with a note. */
  const [action, setAction] = useState("approve"); // "approve" | "remove"
  const [note, setNote] = useState("");
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
  const row = { display: "grid", gap: 8 };
  const primaryBtn = {
    height: 36,
    padding: "0 14px",
    borderRadius: 10,
    border: `1px solid var(--border-color)`,
    background: action === "approve" ? "#10B981" : "#EF4444",
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
      const path =
        action === "approve"
          ? `/admin/posts/${encodeURIComponent(postItem?.id || "")}/approve`
          : `/admin/posts/${encodeURIComponent(postItem?.id || "")}/remove`;
      await post(path, { note: note || undefined });
      setToast(action === "approve" ? "Approved" : "Removed");
      setTimeout(() => {
        setToast(null);
        onClose && onClose({ success: true, action, note });
      }, 800);
    } catch (e) {
      setToast((e && (e.data?.message || e.message)) || "Failed to submit");
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose && onClose(null)}
      title={`Moderate post${postItem?.title ? `: ${postItem.title}` : ""}`}
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
        <label style={label} htmlFor="pm_action">
          Action
        </label>
        <select
          id="pm_action"
          style={input}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          autoFocus
        >
          <option value="approve">Approve</option>
          <option value="remove">Remove</option>
        </select>
      </div>

      <div style={row}>
        <label style={label} htmlFor="pm_note">
          Note (optional)
        </label>
        <textarea
          id="pm_note"
          style={textarea}
          placeholder="Add a moderation note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        <button style={secondaryBtn} onClick={() => onClose && onClose(null)} disabled={saving}>
          Cancel
        </button>
        <button style={primaryBtn} onClick={onSubmit} disabled={saving}>
          {saving ? "Saving…" : action === "approve" ? "Approve" : "Remove"}
        </button>
      </div>
    </Modal>
  );
}

PostModerationModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  postItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
  }),
};
