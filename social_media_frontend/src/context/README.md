# Auth Context Usage

Wrap your application with the AuthProvider in `src/index.js` or the top-level router layout.

Example (React Router v6):

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "../App";
import { AuthProvider, ProtectedRoute, PublicOnlyRoute } from "./AuthContext";

function ProtectedShell({ children }) {
  const navigate = useNavigate();
  return (
    <ProtectedRoute routerNavigate={navigate} redirectTo="/login" fallback={null}>
      {children}
    </ProtectedRoute>
  );
}

function PublicOnlyShell({ children }) {
  const navigate = useNavigate();
  return (
    <PublicOnlyRoute routerNavigate={navigate} redirectTo="/" fallback={null}>
      {children}
    </PublicOnlyRoute>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedShell>
                <App />
              </ProtectedShell>
            }
          />
          <Route
            path="/login"
            element={
              <PublicOnlyShell>
                <div>Login Page</div>
              </PublicOnlyShell>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
```

Inside components:

```jsx
import { useAuth } from "./AuthContext";

function LoginForm() {
  const { login } = useAuth();
  const onSubmit = async (e) => {
    e.preventDefault();
    // After calling backend to verify credentials:
    login("jwt-token-here", { id: "123", name: "Jane" }, { remember: true });
  };
  return null;
}
```

Notes:
- `login(token, user, { remember })` stores data in localStorage if remember is true, sessionStorage otherwise.
- `logout()` clears both storage and in-memory state.
- `isAuthenticated` indicates if a token is present.
- `ready` is true after initial hydration from storage completes.
