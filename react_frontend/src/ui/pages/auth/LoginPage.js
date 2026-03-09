import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../state/auth/AuthContext";
import { useToast } from "../../../state/toast/ToastContext";
import { Input } from "../../components/Input";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login screen (public). Redirects to the prior location after successful login. */
  const { login, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await login(email.trim(), password);
      toast.success("Welcome back", "Login successful.");
      const to = location.state?.from || "/dashboard";
      navigate(to, { replace: true });
    } catch (err) {
      toast.error("Login failed", err?.message || "Please check your credentials.");
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard">
        <div className="authHeading">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1>Sign in</h1>
            <p className="authHint">Manage projects and tasks with your team.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="formGrid">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              ariaLabel="Email"
              leftIcon="user"
              name="email"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              ariaLabel="Password"
              type="password"
              name="password"
              autoComplete="current-password"
            />
          </div>

          <div className="btnRow" style={{ justifyContent: "space-between" }}>
            <button className="btn btnPrimary" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <Link className="btn btnGhost" to="/register">
              Create account
            </Link>
          </div>

          <div className="small">
            Tip: If your backend does not yet expose auth endpoints, set{" "}
            <span className="kbd">REACT_APP_USE_MOCK_API=true</span> to use the mock API.
          </div>
        </form>
      </div>
    </div>
  );
}
