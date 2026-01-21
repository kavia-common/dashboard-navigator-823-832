import React, { useEffect, useMemo, useState } from "react";
import { get, request } from "../api/client";
import { useAuth } from "../context/AuthContext";

/**
 * Profile page
 * - Loads current user profile via GET /profile/me on mount
 * - Displays data in a controlled editable form
 * - Supports saving via PUT /profile/me with optimistic UI update
 * - Applies modern light theme styles using CSS variables from App.css
 */

// PUBLIC_INTERFACE
export default function Profile() {
  /** Profile page for viewing and editing the current user's information. */
  const { user, setUser } = useAuth?.() || { user: null, setUser: () => {} };

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  // Load profile on mount
  useEffect(() => {
    let aborted = false;
    async function loadMe() {
      setLoading(true);
      setFetchError(null);
      try {
        const me = await get("/profile/me");
        if (aborted) return;

        const normalized = {
          id: me?.id ?? user?.id ?? "",
          name: me?.name ?? me?.fullName ?? user?.name ?? "",
          username: me?.username ?? me?.handle ?? "",
          email: me?.email ?? "",
          bio: me?.bio ?? "",
          location: me?.location ?? "",
          website: me?.website ?? me?.url ?? "",
          // any extra fields ignored for now
        };
        setForm(normalized);
        // keep local auth user minimally in sync if meaningful fields exist
        if (setUser && (normalized.name || normalized.username)) {
          setUser((prev) => ({ ...(prev || {}), ...normalized }));
        }
      } catch (e) {
        if (aborted) return;
        const msg =
          (e && (e.data?.message || e.message)) || "Failed to load your profile.";
        setFetchError(msg);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    loadMe();
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast autoclear
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const onChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Basic required validation for name and email
    if (!String(form.name || "").trim()) {
      setToast("Please provide your name");
      return;
    }
    if (!String(form.email || "").trim()) {
      setToast("Please provide your email");
      return;
    }

    setSaving(true);

    const prevUser = user;
    const prevForm = { ...form };

    // Optimistic: update AuthContext immediately
    try {
      if (setUser) {
        setUser((u) => ({
          ...(u || {}),
          name: form.name,
          username: form.username,
          email: form.email,
          bio: form.bio,
          location: form.location,
          website: form.website,
        }));
      }

      // Send PUT /profile/me
      const res = await request("/profile/me", {
        method: "PUT",
        body: {
          name: form.name,
          username: form.username,
          email: form.email,
          bio: form.bio,
          location: form.location,
          website: form.website,
        },
      });

      // Normalize response back into form and auth user
      const normalized = {
        name: res?.name ?? form.name,
        username: res?.username ?? form.username,
        email: res?.email ?? form.email,
        bio: res?.bio ?? form.bio,
        location: res?.location ?? form.location,
        website: res?.website ?? form.website,
      };
      setForm((f) => ({ ...f, ...normalized }));
      if (setUser) {
        setUser((u) => ({ ...(u || {}), ...normalized }));
      }

      setDirty(false);
      setToast("Profile saved");
    } catch (e) {
      // Revert optimistic changes
      if (setUser) {
        setUser(prevUser || null);
      }
      setForm(prevForm);
      const msg =
        (e && (e.data?.message || e.message)) || "Failed to save profile.";
      setToast(msg);
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(() => {
    const page = {
      padding: 16,
      display: "grid",
      gap: 12,
    };
    const headerRow = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    };
    const title = { fontSize: 22, fontWeight: 800, color: "var(--text-primary)" };
    const subtitle = { fontSize: 13, color: "rgba(0,0,0,0.55)" };

    const panel = {
      border: `1px solid var(--border-color)`,
      borderRadius: 14,
      background: "var(--bg-primary)",
      padding: 14,
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
    };

    const formGrid = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
    };

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

    const actions = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 };
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

    const loadingBox = {
      padding: 12,
      borderRadius: 12,
      border: `1px solid var(--border-color)`,
      background: "var(--bg-secondary)",
    };

    const errorBox = {
      padding: 12,
      borderRadius: 12,
      border: `1px solid rgba(239,68,68,0.25)`,
      background: "rgba(239,68,68,0.06)",
      color: "#EF4444",
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
      page,
      headerRow,
      title,
      subtitle,
      panel,
      formGrid,
      label,
      input,
      textarea,
      actions,
      primaryBtn,
      secondaryBtn,
      loadingBox,
      errorBox,
      toastStyle,
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <div style={styles.title}>Your Profile</div>
          <div style={styles.subtitle}>Manage your personal information</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: `1px solid var(--border-color)`,
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {user?.username ? `@${user.username}` : "Member"}
          </span>
        </div>
      </div>

      {toast && (
        <div role="status" aria-live="polite" style={styles.toastStyle}>
          {toast}
        </div>
      )}

      {loading && <div style={styles.loadingBox}>Loading your profile…</div>}
      {fetchError && !loading && <div style={styles.errorBox}>{fetchError}</div>}

      {!loading && !fetchError && (
        <section aria-label="Profile form" style={styles.panel}>
          <form onSubmit={onSubmit}>
            <div style={styles.formGrid}>
              <div>
                <label htmlFor="name" style={styles.label}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Your full name"
                  style={styles.input}
                  autoComplete="name"
                />
              </div>

              <div>
                <label htmlFor="username" style={styles.label}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => onChange("username", e.target.value)}
                  placeholder="Preferred handle"
                  style={styles.input}
                  autoComplete="nickname"
                />
              </div>

              <div>
                <label htmlFor="email" style={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="you@example.com"
                  style={styles.input}
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="location" style={styles.label}>
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={form.location}
                  onChange={(e) => onChange("location", e.target.value)}
                  placeholder="City, Country"
                  style={styles.input}
                  autoComplete="address-level2"
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="website" style={styles.label}>
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  value={form.website}
                  onChange={(e) => onChange("website", e.target.value)}
                  placeholder="https://example.com"
                  style={styles.input}
                  autoComplete="url"
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="bio" style={styles.label}>
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => onChange("bio", e.target.value)}
                  placeholder="Tell others a bit about yourself"
                  style={styles.textarea}
                />
              </div>
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                style={styles.secondaryBtn}
                onClick={() => {
                  // re-fetch from server to discard local edits
                  setDirty(false);
                  setLoading(true);
                  setFetchError(null);
                  (async () => {
                    try {
                      const me = await get("/profile/me");
                      const normalized = {
                        id: me?.id ?? user?.id ?? "",
                        name: me?.name ?? me?.fullName ?? user?.name ?? "",
                        username: me?.username ?? me?.handle ?? "",
                        email: me?.email ?? "",
                        bio: me?.bio ?? "",
                        location: me?.location ?? "",
                        website: me?.website ?? me?.url ?? "",
                      };
                      setForm(normalized);
                      setToast("Reverted changes");
                    } catch (e) {
                      const msg =
                        (e && (e.data?.message || e.message)) ||
                        "Failed to reload profile.";
                      setToast(msg);
                    } finally {
                      setLoading(false);
                    }
                  })();
                }}
                disabled={saving}
              >
                Revert
              </button>
              <button type="submit" style={styles.primaryBtn} disabled={saving || !dirty}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
