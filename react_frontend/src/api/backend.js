import { createApiClient } from "./apiClient";

/**
 * NOTE:
 * The current backend container appears to expose only a health endpoint GET /.
 * This module provides:
 * 1) a "real" adapter (api) for when endpoints exist
 * 2) a mock adapter for local UI completeness
 *
 * Switching rule:
 * - If REACT_APP_USE_MOCK_API === "true", use mock.
 * - Otherwise, use real.
 */

const USE_MOCK = String(process.env.REACT_APP_USE_MOCK_API || "").toLowerCase() === "true";

/**
 * In-memory mock store (non-persistent).
 * Kept deliberately simple: enough to satisfy required UI flows.
 */
const mockDb = {
  users: [
    {
      id: "u_1",
      name: "Demo User",
      email: "demo@example.com",
      role: "member"
    }
  ],
  projects: [
    {
      id: "p_1",
      name: "Website Redesign",
      description: "Refresh landing pages and UI kit",
      createdAt: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: "t_1",
      projectId: "p_1",
      title: "Design dashboard layout",
      description: "Sidebar + top app bar + cards",
      assignee: "Demo User",
      status: "In Progress",
      priority: "High",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
      createdAt: new Date().toISOString()
    }
  ]
};

function id(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// PUBLIC_INTERFACE
export function createBackend(getToken) {
  /**
   * Backend adapter (contract-first):
   * - Auth: login/register/me/logout
   * - Projects: list/create/update/delete
   * - Tasks: list/create/update/delete + filtering
   *
   * Errors are thrown as {message,status,data} similar to apiClient.
   */
  const api = createApiClient(getToken);

  if (!USE_MOCK) {
    return {
      health: () => api.get("/"),
      auth: {
        login: (payload) => api.post("/auth/login", payload),
        register: (payload) => api.post("/auth/register", payload),
        me: () => api.get("/me"),
        logout: () => Promise.resolve()
      },
      projects: {
        list: () => api.get("/projects"),
        create: (payload) => api.post("/projects", payload),
        update: (id_, payload) => api.put(`/projects/${id_}`, payload),
        remove: (id_) => api.del(`/projects/${id_}`)
      },
      tasks: {
        list: (query) => {
          const qs = query ? `?${new URLSearchParams(query).toString()}` : "";
          return api.get(`/tasks${qs}`);
        },
        create: (payload) => api.post("/tasks", payload),
        update: (id_, payload) => api.put(`/tasks/${id_}`, payload),
        remove: (id_) => api.del(`/tasks/${id_}`)
      },
      users: {
        updateProfile: (payload) => api.put("/me", payload)
      }
    };
  }

  // Mock adapter
  return {
    health: async () => {
      await sleep(200);
      return { status: "ok", message: "Mock API healthy" };
    },
    auth: {
      login: async ({ email }) => {
        await sleep(400);
        const user = mockDb.users.find((u) => u.email === email) || mockDb.users[0];
        return {
          token: "mock-token",
          user
        };
      },
      register: async ({ name, email }) => {
        await sleep(500);
        const existing = mockDb.users.find((u) => u.email === email);
        if (existing) {
          throw { message: "Email already registered", status: 409, data: null };
        }
        const user = { id: id("u"), name, email, role: "member" };
        mockDb.users.push(user);
        return { token: "mock-token", user };
      },
      me: async () => {
        await sleep(200);
        return mockDb.users[0];
      },
      logout: async () => {
        await sleep(100);
        return { ok: true };
      }
    },
    projects: {
      list: async () => {
        await sleep(250);
        return [...mockDb.projects].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      },
      create: async ({ name, description }) => {
        await sleep(400);
        const project = { id: id("p"), name, description, createdAt: new Date().toISOString() };
        mockDb.projects.unshift(project);
        return project;
      },
      update: async (projectId, payload) => {
        await sleep(350);
        const idx = mockDb.projects.findIndex((p) => p.id === projectId);
        if (idx < 0) throw { message: "Project not found", status: 404, data: null };
        mockDb.projects[idx] = { ...mockDb.projects[idx], ...payload };
        return mockDb.projects[idx];
      },
      remove: async (projectId) => {
        await sleep(250);
        mockDb.projects = mockDb.projects.filter((p) => p.id !== projectId);
        mockDb.tasks = mockDb.tasks.filter((t) => t.projectId !== projectId);
        return { ok: true };
      }
    },
    tasks: {
      list: async (query = {}) => {
        await sleep(250);
        let tasks = [...mockDb.tasks];
        if (query.projectId) tasks = tasks.filter((t) => t.projectId === query.projectId);
        if (query.status) tasks = tasks.filter((t) => t.status === query.status);
        if (query.priority) tasks = tasks.filter((t) => t.priority === query.priority);
        if (query.q) {
          const q = String(query.q).toLowerCase();
          tasks = tasks.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              (t.description || "").toLowerCase().includes(q) ||
              (t.assignee || "").toLowerCase().includes(q)
          );
        }
        return tasks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      },
      create: async (payload) => {
        await sleep(450);
        const task = {
          id: id("t"),
          createdAt: new Date().toISOString(),
          ...payload
        };
        mockDb.tasks.unshift(task);
        return task;
      },
      update: async (taskId, payload) => {
        await sleep(350);
        const idx = mockDb.tasks.findIndex((t) => t.id === taskId);
        if (idx < 0) throw { message: "Task not found", status: 404, data: null };
        mockDb.tasks[idx] = { ...mockDb.tasks[idx], ...payload };
        return mockDb.tasks[idx];
      },
      remove: async (taskId) => {
        await sleep(250);
        mockDb.tasks = mockDb.tasks.filter((t) => t.id !== taskId);
        return { ok: true };
      }
    },
    users: {
      updateProfile: async (payload) => {
        await sleep(300);
        mockDb.users[0] = { ...mockDb.users[0], ...payload };
        return mockDb.users[0];
      }
    }
  };
}
