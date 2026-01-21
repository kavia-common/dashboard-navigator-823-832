import React, { useEffect, useMemo, useState } from "react";
import { get } from "../api/client";

/**
 * Dashboard page that shows analytics summary cards and a lightweight chart.
 * - Fetches summary: GET /analytics/summary
 * - Fetches daily metrics: GET /analytics/daily?days=30
 * - Uses a simple canvas-based line chart to avoid heavy deps
 * - Modern light theme using CSS variables in App.css (design tokens)
 */

// Helpers to format numbers nicely
function compactNumber(n) {
  try {
    return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n ?? 0);
  } catch {
    return String(n ?? 0);
  }
}

// Lightweight line chart component using HTML canvas
function LineChart({ data = [], height = 180, color = "#3B82F6", label = "Value" }) {
  const ref = React.useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    ctx.clearRect(0, 0, width, height);

    // Guard no data
    if (!data || data.length === 0) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
      ctx.fillText("No data", 12, height / 2);
      return;
    }

    const padding = { top: 16, right: 8, bottom: 24, left: 30 };
    const innerW = Math.max(0, width - padding.left - padding.right);
    const innerH = Math.max(0, height - padding.top - padding.bottom);

    const values = data.map((d) => Number(d.value || 0));
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const range = maxV - minV || 1;

    // Grid lines (Y)
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (innerH * i) / gridLines;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y axis labels
      const val = maxV - (range * i) / gridLines;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = "10px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
      ctx.fillText(compactNumber(val), 2, y + 3);
    }
    ctx.setLineDash([]);

    // Line path
    const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + i * stepX;
      const y =
        padding.top + innerH - ((Number(d.value || 0) - minV) / range) * innerH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill under curve
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, `${color}33`); // ~0.2 alpha
    gradient.addColorStop(1, `${color}00`);
    ctx.lineTo(padding.left + innerW, height - padding.bottom);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // X axis labels (sparse)
    const maxTicks = 6;
    const tickEvery = Math.ceil(data.length / maxTicks);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.font = "10px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
    data.forEach((d, i) => {
      if (i % tickEvery === 0 || i === data.length - 1) {
        const x = padding.left + i * stepX;
        const y = height - 8;
        const labelText = d.label || d.date || `${i + 1}`;
        const text = String(labelText);
        const textWidth = ctx.measureText(text).width;
        ctx.fillText(text, Math.max(padding.left, Math.min(x - textWidth / 2, width - padding.right - textWidth)), y);
      }
    });

    // Legend label
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.font = "12px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial";
    ctx.fillText(label, padding.left, 12);
  }, [data, height, color, label]);

  return (
    <div style={{ width: "100%", height, position: "relative" }}>
      <canvas ref={ref} style={{ width: "100%", height }} aria-label="Line chart visualization" />
    </div>
  );
}

// PUBLIC_INTERFACE
export default function Dashboard() {
  /** Analytics dashboard with summary cards and daily trend chart. */
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cards = useMemo(() => {
    return [
      {
        key: "totalUsers",
        title: "Total Users",
        color: "#3B82F6",
        bg: "rgba(59,130,246,0.08)",
        value: summary?.totalUsers,
        delta: summary?.newUsers24h,
        deltaLabel: "in 24h",
        icon: "👥",
      },
      {
        key: "activeUsers",
        title: "Active Users",
        color: "#10B981",
        bg: "rgba(16,185,129,0.08)",
        value: summary?.activeUsers,
        delta: summary?.activeUsersChange,
        deltaLabel: "vs yesterday",
        icon: "⚡",
      },
      {
        key: "posts",
        title: "Posts",
        color: "#F59E0B",
        bg: "rgba(245,158,11,0.10)",
        value: summary?.totalPosts,
        delta: summary?.posts24h,
        deltaLabel: "in 24h",
        icon: "📝",
      },
      {
        key: "engagement",
        title: "Engagement",
        color: "#EF4444",
        bg: "rgba(239,68,68,0.08)",
        value: summary?.engagementRate,
        valueSuffix: "%",
        delta: summary?.engagementChange,
        deltaLabel: "vs yesterday",
        icon: "❤️",
      },
    ];
  }, [summary]);

  useEffect(() => {
    let aborted = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [summaryRes, dailyRes] = await Promise.all([
          get("/analytics/summary"),
          get("/analytics/daily", { days: 30 }),
        ]);
        if (aborted) return;
        setSummary(summaryRes || {});
        // Expecting dailyRes as array of { date, value } or { label, value }
        const normalized = Array.isArray(dailyRes)
          ? dailyRes.map((d) => ({
              label: d.date || d.label || "",
              value: Number(d.value ?? d.count ?? 0),
            }))
          : [];
        setDaily(normalized);
      } catch (e) {
        if (aborted) return;
        // Normalize error message
        const msg =
          (e && (e.data?.message || e.message)) ||
          "Failed to load analytics data.";
        setError(msg);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    fetchData();
    return () => {
      aborted = true;
    };
  }, []);

  const pageStyle = {
    padding: 16,
    display: "grid",
    gap: 12,
  };

  const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const titleStyle = {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: 0.2,
    color: "var(--text-primary)",
  };

  const subTitleStyle = {
    fontSize: 13,
    color: "rgba(0,0,0,0.55)",
  };

  const cardsGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 12,
  };

  const cardStyleBase = {
    border: `1px solid var(--border-color)`,
    borderRadius: 14,
    backgroundColor: "var(--bg-primary)",
    padding: 14,
    display: "grid",
    gap: 8,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  };

  const chartPanel = {
    border: `1px solid var(--border-color)`,
    borderRadius: 14,
    backgroundColor: "var(--bg-primary)",
    padding: 14,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  };

  const loadingStyle = {
    padding: 14,
    borderRadius: 12,
    background: "var(--bg-primary)",
    border: `1px solid var(--border-color)`,
  };

  return (
    <div style={pageStyle}>
      <div style={headerRow}>
        <div>
          <div style={titleStyle}>Dashboard</div>
          <div style={subTitleStyle}>Overview of platform performance</div>
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
            Last 30 days
          </span>
        </div>
      </div>

      {loading && (
        <div role="status" aria-live="polite" style={loadingStyle}>
          Loading analytics…
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          style={{
            ...loadingStyle,
            color: "#EF4444",
            borderColor: "rgba(239,68,68,0.25)",
            background: "rgba(239,68,68,0.06)",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section aria-label="Summary cards" style={cardsGrid}>
            {cards.map((c) => (
              <div
                key={c.key}
                style={{
                  ...cardStyleBase,
                  background: `linear-gradient(180deg, ${c.bg} 0%, rgba(255,255,255,0.9) 100%)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    aria-hidden
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: c.bg,
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: 16,
                    }}
                  >
                    {c.icon}
                  </span>
                  <div style={{ fontWeight: 700, color: "rgba(0,0,0,0.65)" }}>{c.title}</div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>
                    {compactNumber(c.value)}
                    {c.valueSuffix ? c.valueSuffix : ""}
                  </div>
                  {typeof c.delta !== "undefined" && c.delta !== null && (
                    <div
                      title={c.deltaLabel}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: (Number(c.delta) || 0) >= 0 ? "#10B981" : "#EF4444",
                      }}
                    >
                      {(Number(c.delta) || 0) >= 0 ? "▲" : "▼"} {compactNumber(Math.abs(Number(c.delta) || 0))}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{c.deltaLabel}</div>
              </div>
            ))}
          </section>

          <section aria-label="Analytics trends" style={chartPanel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>Daily Activity</div>
              <div style={{ fontSize: 12, color: "rgba(0,0,0,0.55)" }}>
                {daily?.length || 0} points
              </div>
            </div>
            <LineChart
              data={daily}
              height={220}
              color="#3B82F6"
              label="Daily"
            />
          </section>
        </>
      )}
    </div>
  );
}
