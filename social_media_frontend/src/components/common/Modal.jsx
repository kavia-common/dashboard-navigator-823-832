import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * Reusable, accessible modal component.
 * - Focus trap (first/last focusable cycling)
 * - Closes on ESC and overlay click
 * - Renders a header with title and a close button
 * - Uses CSS variables from App.css for theming
 */
// PUBLIC_INTERFACE
export default function Modal({
  isOpen,
  onClose,
  title = "Dialog",
  children,
  size = "md",
  ariaLabel,
  footer,
  preventCloseOnOverlay = false,
}) {
  /** Accessible modal dialog for re-use across the app. */
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    lastActiveRef.current = document.activeElement;

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose && onClose();
      }
      if (e.key === "Tab") {
        // focus trap
        const focusable = panelRef.current
          ? panelRef.current.querySelectorAll(
              'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
          : [];
        const list = Array.from(focusable);
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    // set initial focus
    setTimeout(() => {
      if (!panelRef.current) return;
      const autoFocus =
        panelRef.current.querySelector("[autofocus]") ||
        panelRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
      if (autoFocus && typeof autoFocus.focus === "function") autoFocus.focus();
      else panelRef.current.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (lastActiveRef.current && typeof lastActiveRef.current.focus === "function") {
        lastActiveRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const panelWidth =
    size === "sm" ? "420px" : size === "lg" ? "720px" : size === "xl" ? "920px" : "520px";

  const overlayStyle = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  };

  const panelStyle = {
    width: `min(92vw, ${panelWidth})`,
    background: "var(--bg-primary)",
    borderRadius: 14,
    border: `1px solid var(--border-color)`,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
    outline: "none",
  };

  const headerStyle = {
    padding: "14px 16px",
    fontWeight: 800,
    borderBottom: `1px solid var(--border-color)`,
    background: "var(--bg-secondary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const closeBtn = {
    height: 32,
    padding: "0 10px",
    borderRadius: 8,
    border: `1px solid var(--border-color)`,
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontWeight: 700,
    cursor: "pointer",
  };

  const contentStyle = { padding: 16, display: "grid", gap: 10 };
  const footerStyle = {
    padding: 12,
    borderTop: `1px solid var(--border-color)`,
    display: "flex",
    justifyContent: "flex-end",
    background: "var(--bg-secondary)",
    gap: 8,
  };

  return (
    <div
      ref={overlayRef}
      style={overlayStyle}
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel || title}
      onClick={(e) => {
        if (preventCloseOnOverlay) return;
        if (e.target === overlayRef.current) {
          onClose && onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        style={panelStyle}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-panel"
      >
        <div style={headerStyle}>
          <div>{title}</div>
          <button style={closeBtn} onClick={() => onClose && onClose()} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div style={contentStyle}>{children}</div>
        {footer ? <div style={footerStyle}>{footer}</div> : null}
      </div>
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node,
  size: PropTypes.oneOf(["sm", "md", "lg", "xl"]),
  ariaLabel: PropTypes.string,
  footer: PropTypes.node,
  preventCloseOnOverlay: PropTypes.bool,
};
