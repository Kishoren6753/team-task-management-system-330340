import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export function NotFoundPage() {
  /** Fallback page for unknown routes. */
  return (
    <div className="authWrap">
      <div className="card authCard">
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Page not found</h1>
        <p className="authHint">The page you’re looking for doesn’t exist.</p>
        <div className="btnRow">
          <Link className="btn btnPrimary" to="/dashboard">
            Go to dashboard
          </Link>
          <Link className="btn" to="/projects">
            View projects
          </Link>
        </div>
      </div>
    </div>
  );
}
