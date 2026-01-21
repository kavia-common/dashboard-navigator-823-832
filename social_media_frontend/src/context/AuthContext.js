import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

/**
 * Auth context and helpers for managing authentication state (token, user)
 * and providing guard components for protected and public-only routes.
 *
 * This implementation:
 * - Persists token (and minimal user info if provided) to localStorage or sessionStorage
 * - Hydrates on app load
 * - Exposes login/logout helpers and a ready flag for initial hydration
 * - Prepares for future backend integration (e.g., refresh tokens, profile fetch)
 */

// Storage keys
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const STORAGE_KEY = "auth_storage"; // "local" | "session"

// Create the React context
const AuthContext = createContext(null);

// Utils: safe storage access
function getStorage(kind) {
  try {
    if (typeof window === "undefined") return null;
    if (kind === "session") return window.sessionStorage || null;
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function readPersistedAuth() {
  try {
    if (typeof window === "undefined") return { token: null, user: null, storageKind: "local" };

    // Determine which storage was last used
    const storageKind =
      (window.localStorage && window.localStorage.getItem(STORAGE_KEY)) ||
      (window.sessionStorage && window.sessionStorage.getItem(STORAGE_KEY)) ||
      "local";

    const store = getStorage(storageKind) || getStorage("local") || getStorage("session");
    const token = store ? store.getItem(TOKEN_KEY) : null;
    let user = null;
    const rawUser = store ? store.getItem(USER_KEY) : null;
    if (rawUser) {
      try {
        user = JSON.parse(rawUser);
      } catch {
        user = null;
      }
    }
    return { token, user, storageKind };
  } catch {
    return { token: null, user: null, storageKind: "local" };
  }
}

function persistAuth({ token, user, storageKind }) {
  try {
    const store = getStorage(storageKind) || getStorage("local");
    if (!store) return;

    // Clear from both storages to avoid duplicates
    const local = getStorage("local");
    const session = getStorage("session");
    [local, session].forEach(s => {
      if (!s) return;
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
      s.removeItem(STORAGE_KEY);
    });

    if (token) {
      store.setItem(TOKEN_KEY, token);
      store.setItem(STORAGE_KEY, storageKind);
      if (user) {
        store.setItem(USER_KEY, JSON.stringify(user));
      }
    }
  } catch {
    // Ignore storage errors
  }
}

function clearPersistedAuth() {
  try {
    const local = getStorage("local");
    const session = getStorage("session");
    [local, session].forEach(s => {
      if (!s) return;
      s.removeItem(TOKEN_KEY);
      s.removeItem(USER_KEY);
      s.removeItem(STORAGE_KEY);
    });
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
export function AuthProvider({ children, defaultStorage = "local" }) {
  /** Provides authentication context to the application tree. */
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const storageKindRef = useRef(defaultStorage === "session" ? "session" : "local");

  // Hydrate from storage on mount
  useEffect(() => {
    const { token: t, user: u, storageKind } = readPersistedAuth();
    if (t) setToken(t);
    if (u) setUser(u);
    if (storageKind) storageKindRef.current = storageKind;
    setReady(true);
  }, []);

  // Persist on changes
  useEffect(() => {
    if (!ready) return;
    if (token) {
      persistAuth({ token, user, storageKind: storageKindRef.current });
    } else {
      clearPersistedAuth();
    }
  }, [token, user, ready]);

  // PUBLIC_INTERFACE
  const login = (newToken, profile = null, options = {}) => {
    /**
     * Log in by setting token and optional user profile.
     * options.remember: if true, persist to localStorage; if false, sessionStorage.
     */
    const remember = options && Object.prototype.hasOwnProperty.call(options, "remember") ? options.remember : true;
    storageKindRef.current = remember ? "local" : "session";
    setToken(newToken || null);
    setUser(profile || null);
  };

  // PUBLIC_INTERFACE
  const logout = () => {
    /** Clears token and user from memory and storage. */
    setToken(null);
    setUser(null);
    clearPersistedAuth();
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      ready,
      // mutators
      login,
      logout,
      // helpers
      setUser,
      setToken: (t, { remember = true } = {}) => {
        storageKindRef.current = remember ? "local" : "session";
        setToken(t || null);
      },
    }),
    [token, user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
  defaultStorage: PropTypes.oneOf(["local", "session"]),
};

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access the AuthContext safely. */
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

// PUBLIC_INTERFACE
export function ProtectedRoute({ children, fallback = null, redirectTo = null, routerNavigate }) {
  /**
   * Route guard that renders children only for authenticated users.
   * - If not authenticated:
   *    - If routerNavigate is provided (from react-router), navigate to redirectTo (default: "/login")
   *    - Else, render fallback (default: null)
   *
   * This is router-agnostic. For React Router v6, pass routerNavigate returned from useNavigate().
   */
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    // While hydrating, we can return a simple fallback to avoid flicker
    return fallback;
  }

  if (!isAuthenticated) {
    if (routerNavigate && typeof routerNavigate === "function") {
      routerNavigate(redirectTo || "/login", { replace: true });
      return null;
    }
    return fallback;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
  redirectTo: PropTypes.string,
  routerNavigate: PropTypes.func,
};

// PUBLIC_INTERFACE
export function PublicOnlyRoute({ children, fallback = null, redirectTo = null, routerNavigate }) {
  /**
   * Route guard that prevents authenticated users from accessing the child route
   * (e.g., /login, /register) and redirects them to a target page (default: "/").
   */
  const { isAuthenticated, ready } = useAuth();

  if (!ready) {
    return fallback;
  }

  if (isAuthenticated) {
    if (routerNavigate && typeof routerNavigate === "function") {
      routerNavigate(redirectTo || "/", { replace: true });
      return null;
    }
    return fallback;
  }

  return children;
}

PublicOnlyRoute.propTypes = {
  children: PropTypes.node,
  fallback: PropTypes.node,
  redirectTo: PropTypes.string,
  routerNavigate: PropTypes.func,
};

// PUBLIC_INTERFACE
export function withAuth(Component) {
  /** Higher-order component to inject auth context as props into a component. */
  const Wrapped = (props) => {
    const auth = useAuth();
    return <Component {...props} auth={auth} />;
  };
  Wrapped.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return Wrapped;
}
