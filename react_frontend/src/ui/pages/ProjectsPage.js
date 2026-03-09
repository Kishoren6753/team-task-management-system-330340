import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../state/auth/AuthContext";
import { useToast } from "../../state/toast/ToastContext";
import { Icon } from "../components/Icon";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";

// PUBLIC_INTERFACE
export function ProjectsPage() {
  /** Projects list + CRUD via modal forms, with search/filter. */
  const { backend } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  function resetForm(p) {
    setName(p?.name || "");
    setDescription(p?.description || "");
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const list = await backend.projects.list();
        if (!alive) return;
        setProjects(Array.isArray(list) ? list : []);
      } catch (e) {
        toast.error("Failed to load projects", e?.message || "Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [backend, toast]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(query) ||
        (p.description || "").toLowerCase().includes(query)
    );
  }, [projects, q]);

  function openCreate() {
    setEditing(null);
    resetForm(null);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    resetForm(p);
    setModalOpen(true);
  }

  async function saveProject() {
    try {
      if (!name.trim()) {
        toast.error("Missing name", "Project name is required.");
        return;
      }
      if (editing) {
        const updated = await backend.projects.update(editing.id, {
          name: name.trim(),
          description: description.trim()
        });
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success("Project updated", updated.name);
      } else {
        const created = await backend.projects.create({
          name: name.trim(),
          description: description.trim()
        });
        setProjects((prev) => [created, ...prev]);
        toast.success("Project created", created.name);
      }
      setModalOpen(false);
    } catch (e) {
      toast.error("Save failed", e?.message || "Please try again.");
    }
  }

  async function deleteProject(p) {
    const ok = window.confirm(`Delete project "${p.name}"? This will remove associated tasks.`);
    if (!ok) return;
    try {
      await backend.projects.remove(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      toast.success("Project deleted", p.name);
    } catch (e) {
      toast.error("Delete failed", e?.message || "Please try again.");
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Projects</h1>
          <p className="pageSubtitle">Create and manage team projects.</p>
        </div>
        <div className="btnRow">
          <button className="btn btnPrimary" onClick={openCreate}>
            <Icon name="plus" /> New project
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
              placeholder="Search by name or description…"
              ariaLabel="Search projects"
              leftIcon="search"
            />
          </div>
          <div className="small" style={{ textAlign: "right" }}>
            {loading ? "Loading…" : `${filtered.length} result(s)`}
          </div>
        </div>
      </div>

      <div className="grid grid2">
        {filtered.map((p) => (
          <div className="card" key={p.id}>
            <div className="cardHeaderRow">
              <h3 className="cardTitle">{p.name}</h3>
              <span className="pill pillPrimary">Project</span>
            </div>
            <div className="cardMeta">{p.description || "No description"}</div>

            <div className="hr" />
            <div className="btnRow">
              <button className="btn" onClick={() => openEdit(p)}>
                <Icon name="edit" /> Edit
              </button>
              <button className="btn btnDanger" onClick={() => deleteProject(p)}>
                <Icon name="trash" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        title={editing ? "Edit project" : "New project"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btnPrimary" onClick={saveProject}>
              Save
            </button>
          </>
        }
      >
        <div className="formGrid">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q2 Launch"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: goals, scope, notes…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
