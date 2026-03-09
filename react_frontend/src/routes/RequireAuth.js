import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth/AuthContext";

// PUBLIC_INTERFACE
export function RequireAuth({ children }) {
  /** Route guard: requires auth token; otherwise redirects to login. */
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
