import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./RequireAuth";
import { AppShell } from "../ui/shell/AppShell";
import { LoginPage } from "../ui/pages/auth/LoginPage";
import { RegisterPage } from "../ui/pages/auth/RegisterPage";
import { DashboardPage } from "../ui/pages/DashboardPage";
import { ProjectsPage } from "../ui/pages/ProjectsPage";
import { TasksPage } from "../ui/pages/TasksPage";
import { ProfilePage } from "../ui/pages/ProfilePage";
import { NotFoundPage } from "../ui/pages/NotFoundPage";

// PUBLIC_INTERFACE
export function AppRoutes() {
  /** App routes: public auth pages + protected app routes. */
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
