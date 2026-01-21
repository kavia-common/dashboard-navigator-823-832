import React, { useEffect, useMemo, useState } from "react";
import { fetchNotifications, likeTarget, commentOnTarget } from "../../api/notifications";

/**
 * Right side Notifications/Activity panel.
 * Lists notifications and provides quick interactions (like/comment).
 * - Connects to notifications API with graceful stub fallback
 * - Optimistic UI for like/comment with toasts
 * - Collapsible on small screens
 */
// PUBLIC_INTERFACE
export default function NotificationsPanel() {
  /** Notifications panel with API integration and interactions. */
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [commentDraft, setCommentDraft] = useState({}); // targetId -> text
  const [busy, setBusy] = useState({}); // targetId -> bool

  // Auto-collapse on initial mount if viewport is narrow
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 1024) {
        setCollapsed(true);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchNotifications({ page: 1, pageSize: 20 });
        if (aborted) return;
        setItems(res?.items || []);
      } catch (e) {
        if (aborted) return;
        setError((e && (e.data?.message || e.message)) || "Failed to load notifications.");
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => {
      aborted = true;
    };
  }, []);

  // Toast autoclear
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const panelStyles = useMemo(() => {
    const baseContainer = {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg-primary)",
    };
    const header = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 12px",
      borderBottom: `1px solid var(--border-color)`,
      position: "sticky",
      top: 0,
      background: "var(--bg-primary)",
      zIndex: 5,
    };
    const toggleBtn = {
      height: 32,
      padding: "0 10px",
      borderRadius: 8,
      border: `1px solid var(--border-color)`,
      background: "var(--bg-secondary)",
      color: "var(--text-primary)",
      fontWeight: 600,
      cursor: "pointer",
    };
    const list = {
      listStyle: "none",
      padding: 12,
      margin: 0,
      display: collapsed ? "none" : "block",
    };
    const item = {
      padding: 12,
      marginBottom: 10,
      borderRadius: 12,
      border: `1px solid var(--border-color)`,
      background:
        "linear-gradient(180deg, rgba(59,130,246,0.04) 0%, rgba(255,255,255,0.9) 100%)",
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    };
    const row = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    };
    const meta = { fontSize: 12, color: "rgba(0,0,0,0.55)" };
    const actor = { fontWeight: 700, color: "var(--text-primary)" };
    const actionsRow = { display: "flex", gap: 8, marginTop: 8, alignItems: "center" };
    const btn = {
      height: 30,
      padding: "0 10px",
      borderRadius: 8,
      border: `1px solid var(--border-color)`,
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
      fontWeight: 600,
      cursor: "pointer",
    };
    const likeBtn = { ...btn, backgroundColor: "#FDE68A", borderColor: "#F59E0B33" };
    const commentBtn = { ...btn, backgroundColor: "#DBEAFE", borderColor: "#3B82F633" };
    const input = {
      flex: 1,
      height: 30,
      borderRadius: 8,
      border: `1px solid var(--border-color)`,
      padding: "0 8px",
      background: "var(--bg-primary)",
      color: "var(--text-primary)",
    };
    const loadingStyle = {
      padding: 12,
      margin: 12,
      borderRadius: 12,
      border: `1px solid var(--border-color)`,
      background: "var(--bg-secondary)",
    };
    const toastStyle = {
      position: "fixed",
      right: 16,
      top: 80,
      background: "var(--bg-primary)",
      border: `1px solid var(--border-color)`,
      borderRadius: 10,
      padding: "8px 12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
      zIndex: 100,
      fontWeight: 700,
    };
    return {
      baseContainer,
      header,
      toggleBtn,
      list,
      item,
      row,
      meta,
      actor,
      actionsRow,
      btn,
      likeBtn,
      commentBtn,
      input,
      loadingStyle,
      toastStyle,
    };
  }, [collapsed]);

  const onLike = async (n) => {
    if (!n?.target?.id) return;
    const tId = n.target.id;
    setBusy((b) => ({ ...b, [tId]: true }));
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) =>
        it.id === n.id
          ? { ...it, meta: { ...it.meta, likes: Number(it.meta?.likes || 0) + 1 } }
          : it
      )
    );
    try {
      const res = await likeTarget(n.target.id, n.target.kind || "post");
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id
            ? { ...it, meta: { ...it.meta, likes: Number(res.likes || it.meta?.likes || 0) } }
            : it
        )
      );
      setToast("Liked!");
    } catch {
      // Revert optimistic on error
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id
            ? { ...it, meta: { ...it.meta, likes: Math.max(0, Number(it.meta?.likes || 1) - 1) } }
            : it
        )
      );
      setToast("Failed to like");
    } finally {
      setBusy((b) => ({ ...b, [tId]: false }));
    }
  };

  const onComment = async (n) => {
    if (!n?.target?.id) return;
    const tId = n.target.id;
    const text = (commentDraft[tId] || "").trim();
    if (!text) {
      setToast("Type a comment");
      return;
    }
    setBusy((b) => ({ ...b, [tId]: true }));
    // Optimistic
    setItems((prev) =>
      prev.map((it) =>
        it.id === n.id
          ? { ...it, meta: { ...it.meta, comments: Number(it.meta?.comments || 0) + 1 } }
          : it
      )
    );
    try {
      const res = await commentOnTarget(n.target.id, text, n.target.kind || "post");
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id
            ? {
                ...it,
                meta: {
                  ...it.meta,
                  comments: Number(res.comments || it.meta?.comments || 0),
                },
              }
            : it
        )
      );
      setCommentDraft((d) => ({ ...d, [tId]: "" }));
      setToast("Comment posted");
    } catch {
      // Revert optimistic on error
      setItems((prev) =>
        prev.map((it) =>
          it.id === n.id
            ? {
                ...it,
                meta: {
                  ...it.meta,
                  comments: Math.max(0, Number(it.meta?.comments || 1) - 1),
                },
              }
            : it
        )
      );
      setToast("Failed to comment");
    } finally {
      setBusy((b) => ({ ...b, [tId]: false }));
    }
  };

  const emptyState = (
    <div style={{ padding: 12, color: "rgba(0,0,0,0.55)", fontSize: 13 }}>No notifications</div>
  );

  return (
    <aside style={panelStyles.baseContainer} aria-label="Notifications and Interactions">
      <div style={panelStyles.header}>
        <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>Notifications</div>
        <button
          style={panelStyles.toggleBtn}
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-controls="notifications-list"
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {toast && (
        <div role="status" aria-live="polite" style={panelStyles.toastStyle}>
          {toast}
        </div>
      )}

      {loading && <div style={panelStyles.loadingStyle}>Loading…</div>}
      {error && !loading && (
        <div
          role="alert"
          style={{
            ...panelStyles.loadingStyle,
            color: "#EF4444",
            borderColor: "rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.06)",
          }}
        >
          {error}
        </div>
      )}

      <ul id="notifications-list" style={panelStyles.list}>
        {!loading && !error && items.length === 0 && <li>{emptyState}</li>}
        {items.map((n) => {
          const tId = n?.target?.id || n.id;
          const isBusy = Boolean(busy[tId]);
          const likes = Number(n?.meta?.likes ?? 0);
          const comments = Number(n?.meta?.comments ?? 0);
          return (
            <li key={n.id} style={panelStyles.item}>
              <div style={panelStyles.row}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>
                    <span style={panelStyles.actor}>{n?.actor?.name || "Someone"}</span>{" "}
                    <span style={{ color: "rgba(0,0,0,0.75)" }}>{n?.text || "updated activity"}</span>
                  </div>
                  {n?.target?.title && (
                    <div style={panelStyles.meta} title={n?.target?.id}>
                      {n?.target?.title}
                    </div>
                  )}
                </div>
                <div style={panelStyles.meta}>
                  {new Date(n?.createdAt || Date.now()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div style={panelStyles.actionsRow}>
                <button
                  style={panelStyles.likeBtn}
                  onClick={() => onLike(n)}
                  disabled={isBusy}
                  aria-label="Like"
                  title="Like"
                >
                  ❤️ {likes}
                </button>
                <input
                  style={panelStyles.input}
                  placeholder="Write a comment…"
                  value={commentDraft[tId] ?? ""}
                  onChange={(e) =>
                    setCommentDraft((d) => ({
                      ...d,
                      [tId]: e.target.value,
                    }))
                  }
                  disabled={isBusy}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onComment(n);
                  }}
                  aria-label="Comment text"
                />
                <button
                  style={panelStyles.commentBtn}
                  onClick={() => onComment(n)}
                  disabled={isBusy}
                  aria-label="Post comment"
                  title="Post comment"
                >
                  💬 {comments}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
