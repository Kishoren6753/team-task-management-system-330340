import { createApiClient } from "./apiClient";

/**
 * Backend adapter:
 * - Real adapter matches the Express API in team-task-management-system-330339/express_backend.
 * - Mock adapter keeps UI usable when backend is unavailable.
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

const STATUS_TO_ENUM = {
  Todo: "todo",
  "In Progress": "in_progress",
  Blocked: "blocked",
  Done: "done",
  Archived: "archived"
};

const ENUM_TO_STATUS = Object.fromEntries(
  Object.entries(STATUS_TO_ENUM).map(([label, value]) => [value, label])
);

const PRIORITY_TO_ENUM = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Urgent: "urgent"
};

const ENUM_TO_PRIORITY = Object.fromEntries(
  Object.entries(PRIORITY_TO_ENUM).map(([label, value]) => [value, label])
);

function toBackendTaskPayload(uiPayload) {
  // UI uses friendly labels; backend uses enum values.
  return {
    title: uiPayload.title,
    description: uiPayload.description || null,
    status: STATUS_TO_ENUM[uiPayload.status] || uiPayload.status || undefined,
    priority: PRIORITY_TO_ENUM[uiPayload.priority] || uiPayload.priority || undefined,
    dueDate: uiPayload.dueDate || null,
    startDate: uiPayload.startDate || null,
    // UI uses free-text assignee; backend uses assignedToUserId.
    // Keep it null until we add a user picker.
    assignedToUserId: null
  };
}

function normalizeTaskFromBackend(t) {
  if (!t) return t;

  return {
    id: t.id,
    projectId: t.project_id ?? t.projectId,
    title: t.title,
    description: t.description ?? "",
    status: ENUM_TO_STATUS[t.status] || t.status,
    priority: ENUM_TO_PRIORITY[t.priority] || t.priority,
    dueDate: t.due_date ?? t.dueDate ?? "",
    startDate: t.start_date ?? t.startDate ?? "",
    assignee: "" // UI-only
  };
}

function normalizeProjectFromBackend(p) {
  if (!p) return p;
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    status: p.status,
    createdAt: p.created_at ?? p.createdAt,
    updatedAt: p.updated_at ?? p.updatedAt
  };
}

function normalizeUserFromBackend(u) {
  if (!u) return u;
  return {
    id: u.id,
    // Frontend uses `name`; backend uses `fullName`.
    name: u.fullName ?? u.full_name ?? u.name ?? "",
    email: u.email,
    role: u.role
  };
}

// PUBLIC_INTERFACE
export function createBackend(getToken) {
  /**
   * Backend adapter (real):
   * - Auth: /auth/login, /auth/register
   * - Profile: /profile/me (GET/PATCH)
   * - Projects: /projects (GET/POST) and /projects/:id (PATCH/DELETE)
   * - Tasks: /projects/:projectId/tasks (GET/POST) and /tasks/:taskId (GET/PATCH/DELETE)
   *
   * Errors are thrown as {message,status,data} similar to apiClient.
   */
  const api = createApiClient(getToken);

  if (!USE_MOCK) {
    return {
      health: () => api.get("/"),
      auth: {
        login: async (payload) => {
          const res = await api.post("/auth/login", payload);
          // Express returns: { accessToken, tokenType, user }
          return {
            token: res.accessToken,
            tokenType: res.tokenType,
            user: normalizeUserFromBackend(res.user)
          };
        },
        register: async (payload) => {
          // UI sends {name,email,password}; backend expects {email,password,fullName}
          const res = await api.post("/auth/register", {
            email: payload.email,
            password: payload.password,
            fullName: payload.name
          });
          return {
            token: res.accessToken,
            tokenType: res.tokenType,
            user: normalizeUserFromBackend(res.user)
          };
        },
        me: async () => {
          const me = await api.get("/profile/me");
          return normalizeUserFromBackend(me);
        },
        logout: () => Promise.resolve()
      },
      projects: {
        list: async () => {
          const res = await api.get("/projects");
          const items = res?.items || [];
          return items.map(normalizeProjectFromBackend);
        },
        create: async (payload) => normalizeProjectFromBackend(await api.post("/projects", payload)),
        update: async (id_, payload) =>
          normalizeProjectFromBackend(await api.patch(`/projects/${id_}`, payload)),
        remove: (id_) => api.del(`/projects/${id_}`)
      },
      tasks: {
        list: async (query = {}) => {
          // UI provides filters including optional projectId.
          // Backend task listing is per-project, so:
          // - if projectId is given, query that project's tasks.
          // - otherwise, perform a global search via /search?type=tasks to simulate "all tasks".
          const { projectId, q, status, priority } = query || {};

          if (projectId) {
            const res = await api.get(
              `/projects/${projectId}/tasks?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(status ? { status: STATUS_TO_ENUM[status] || status } : {}),
                ...(priority ? { priority: PRIORITY_TO_ENUM[priority] || priority } : {})
              }).toString()}`
            );
            return (res?.items || []).map(normalizeTaskFromBackend);
          }

          const res = await api.get(
            `/search?${new URLSearchParams({
              type: "tasks",
              ...(q ? { q } : {}),
              ...(status ? { status: STATUS_TO_ENUM[status] || status } : {}),
              ...(priority ? { priority: PRIORITY_TO_ENUM[priority] || priority } : {})
            }).toString()}`
          );

          return (res?.tasks || []).map(normalizeTaskFromBackend);
        },
        create: async (uiPayload) => {
          const projectId = uiPayload.projectId;
          const created = await api.post(
            `/projects/${projectId}/tasks`,
            toBackendTaskPayload(uiPayload)
          );
          return normalizeTaskFromBackend(created);
        },
        update: async (taskId, uiPayload) => {
          const updated = await api.patch(`/tasks/${taskId}`, toBackendTaskPayload(uiPayload));
          return normalizeTaskFromBackend(updated);
        },
        remove: (taskId) => api.del(`/tasks/${taskId}`)
      },
      users: {
        updateProfile: async (payload) => {
          // UI uses {name,email,role}; backend supports {fullName}
          const updated = await api.patch("/profile/me", {
            fullName: payload.name
          });
          return normalizeUserFromBackend(updated);
        }
      },
      dashboard: {
        summary: () => api.get("/dashboard")
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
