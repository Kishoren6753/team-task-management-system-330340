import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../state/auth/AuthContext";
import { useToast } from "../../../state/toast/ToastContext";
import { Input } from "../../components/Input";

// PUBLIC_INTERFACE
export function RegisterPage() {
  /** Register screen (public). */
  const { register, loading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await register(name.trim(), email.trim(), password);
      toast.success("Account created", "You're signed in.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error("Register failed", err?.message || "Please try again.");
    }
  }

  return (
    <div className="authWrap">
      <div className="card authCard">
        <div className="authHeading">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1>Create account</h1>
            <p className="authHint">Start tracking projects and tasks in minutes.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="formGrid">
          <div>
            <label className="label" htmlFor="name">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              ariaLabel="Name"
              name="name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              ariaLabel="Email"
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
              autoComplete="new-password"
            />
          </div>

          <div className="btnRow" style={{ justifyContent: "space-between" }}>
            <button className="btn btnAccent" disabled={loading} type="submit">
              {loading ? "Creating…" : "Create account"}
            </button>
            <Link className="btn btnGhost" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
