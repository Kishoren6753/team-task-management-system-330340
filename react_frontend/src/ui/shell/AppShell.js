import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth/AuthContext";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { useToast } from "../../state/toast/ToastContext";

function titleForPath(pathname) {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/projects")) return "Projects";
  if (pathname.startsWith("/tasks")) return "Tasks";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Team Task Manager";
}

// PUBLIC_INTERFACE
export function AppShell() {
  /** Main application shell: sidebar + top bar + outlet area. */
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState("");

  const pageTitle = useMemo(() => titleForPath(location.pathname), [location.pathname]);

  async function onLogout() {
    try {
      await logout();
      toast.success("Signed out", "You have been logged out.");
      navigate("/login");
    } catch (e) {
      toast.error("Logout failed", e?.message || "Please try again.");
    }
  }

  function onQuickSearchSubmit(e) {
    e.preventDefault();
    const q = quickSearch.trim();
    navigate(`/tasks${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  }

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Sidebar navigation">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div className="brandText">
            <div className="brandTitle">Team Tasks</div>
            <div className="brandSub">Projects • Tasks • Progress</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
          >
            <span className="navIcon">
              <Icon name="dashboard" />
            </span>
            Dashboard
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
          >
            <span className="navIcon">
              <Icon name="folder" />
            </span>
            Projects
          </NavLink>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
          >
            <span className="navIcon">
              <Icon name="checklist" />
            </span>
            Tasks
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
          >
            <span className="navIcon">
              <Icon name="user" />
            </span>
            Profile
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <div className="small" style={{ marginBottom: 10 }}>
            Signed in as <strong>{user?.name || "User"}</strong>
            <div className="small">{user?.email}</div>
          </div>
          <button className="btn btnDanger" onClick={onLogout}>
            <Icon name="logout" /> Logout
          </button>
        </div>
      </aside>

      <section className="mainArea">
        <header className="topbar" aria-label="Top application bar">
          <div className="topbarTitle">{pageTitle}</div>
          <div className="topbarGrow" />
          <form onSubmit={onQuickSearchSubmit} style={{ width: 360, maxWidth: "45vw" }}>
            <Input
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              placeholder="Quick search tasks… (press Enter)"
              ariaLabel="Quick search tasks"
              leftIcon="search"
            />
          </form>
          <div className="topbarRight">
            <span className="pill pillPrimary">
              <Icon name="spark" /> {user?.role || "member"}
            </span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
