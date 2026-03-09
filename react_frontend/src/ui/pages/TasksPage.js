import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../state/auth/AuthContext";
import { useToast } from "../../state/toast/ToastContext";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { priorityPillClass, statusPillClass } from "../utils/taskUtils";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const STATUSES = ["Todo", "In Progress", "Blocked", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];

// PUBLIC_INTERFACE
export function TasksPage() {
  /** Tasks list + CRUD with search/filter and project association. */
  const { backend } = useAuth();
  const toast = useToast();
  const query = useQuery();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState(query.get("q") || "");
  const [status, setStatus] = useState(query.get("status") || "");
  const [priority, setPriority] = useState(query.get("priority") || "");
  const [projectId, setProjectId] = useState(query.get("projectId") || "");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [formStatus, setFormStatus] = useState("Todo");
  const [formPriority, setFormPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [formProjectId, setFormProjectId] = useState("");

  function resetForm(t) {
    setTitle(t?.title || "");
    setDescription(t?.description || "");
    setAssignee(t?.assignee || "");
    setFormStatus(t?.status || "Todo");
    setFormPriority(t?.priority || "Medium");
    setDueDate(t?.dueDate || "");
    setFormProjectId(t?.projectId || projectId || "");
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [p, t] = await Promise.all([
          backend.projects.list(),
          backend.tasks.list({ q, status, priority, projectId })
        ]);
        if (!alive) return;
        setProjects(Array.isArray(p) ? p : []);
        setTasks(Array.isArray(t) ? t : []);
      } catch (e) {
        toast.error("Failed to load tasks", e?.message || "Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [backend, toast, q, status, priority, projectId]);

  const projectNameById = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p.name]));
    return (id) => map.get(id) || "—";
  }, [projects]);

  function openCreate() {
    setEditing(null);
    resetForm(null);
    setModalOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    resetForm(t);
    setModalOpen(true);
  }

  async function saveTask() {
    try {
      if (!title.trim()) {
        toast.error("Missing title", "Task title is required.");
        return;
      }
      if (!formProjectId) {
        toast.error("Missing project", "Please select a project.");
        return;
      }

      const payload = {
        projectId: formProjectId,
        title: title.trim(),
        description: description.trim(),
        assignee: assignee.trim(),
        status: formStatus,
        priority: formPriority,
        dueDate: dueDate || ""
      };

      if (editing) {
        const updated = await backend.tasks.update(editing.id, payload);
        setTasks((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
        toast.success("Task updated", updated.title);
      } else {
        const created = await backend.tasks.create(payload);
        setTasks((prev) => [created, ...prev]);
        toast.success("Task created", created.title);
      }

      setModalOpen(false);
    } catch (e) {
      toast.error("Save failed", e?.message || "Please try again.");
    }
  }

  async function deleteTask(t) {
    const ok = window.confirm(`Delete task "${t.title}"?`);
    if (!ok) return;
    try {
      await backend.tasks.remove(t.id);
      setTasks((prev) => prev.filter((x) => x.id !== t.id));
      toast.success("Task deleted", t.title);
    } catch (e) {
      toast.error("Delete failed", e?.message || "Please try again.");
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Tasks</h1>
          <p className="pageSubtitle">Search, filter, and manage tasks across projects.</p>
        </div>
        <div className="btnRow">
          <button className="btn btnPrimary" onClick={openCreate}>
            <Icon name="plus" /> New task
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="formGrid formGrid2" style={{ alignItems: "end" }}>
          <div>
            <label className="label">Search</label>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, description, assignee…"
              ariaLabel="Search tasks"
              leftIcon="search"
            />
          </div>

          <div className="formGrid formGrid2">
            <div>
              <label className="label">Project</label>
              <select
                className="select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                aria-label="Filter by project"
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Status</label>
              <select
                className="select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">Any</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Priority</label>
              <select
                className="select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                aria-label="Filter by priority"
              >
                <option value="">Any</option>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="small" style={{ textAlign: "right" }}>
              {loading ? "Loading…" : `${tasks.length} task(s)`}
            </div>
          </div>
        </div>
      </div>

      <div className="tableWrap">
        <table className="table" aria-label="Tasks table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Project</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 800 }}>{t.title}</div>
                  <div className="small" style={{ maxWidth: 520, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.description || "—"}
                  </div>
                </td>
                <td>{projectNameById(t.projectId)}</td>
                <td>{t.assignee || "—"}</td>
                <td>
                  <span className={statusPillClass(t.status)}>{t.status || "—"}</span>
                </td>
                <td>
                  <span className={priorityPillClass(t.priority)}>{t.priority || "—"}</span>
                </td>
                <td>{t.dueDate || "—"}</td>
                <td>
                  <div className="btnRow">
                    <button className="btn" onClick={() => openEdit(t)}>
                      <Icon name="edit" /> Edit
                    </button>
                    <button className="btn btnDanger" onClick={() => deleteTask(t)}>
                      <Icon name="trash" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tasks.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 14 }}>
                  <div className="small">No tasks match your filters.</div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        title={editing ? "Edit task" : "New task"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btnPrimary" onClick={saveTask}>
              Save
            </button>
          </>
        }
      >
        <div className="formGrid">
          <div className="formGrid formGrid2">
            <div>
              <label className="label">Project</label>
              <select
                className="select"
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                aria-label="Task project"
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                className="input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Due date"
              />
            </div>
          </div>

          <div>
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fix onboarding bug"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
            />
          </div>

          <div className="formGrid formGrid2">
            <div>
              <label className="label">Assignee</label>
              <input
                className="input"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Alex"
              />
            </div>

            <div className="formGrid formGrid2">
              <div>
                <label className="label">Status</label>
                <select
                  className="select"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Priority</label>
                <select
                  className="select"
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
