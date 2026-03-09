import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../state/auth/AuthContext";
import { useToast } from "../../state/toast/ToastContext";
import { Icon } from "../components/Icon";
import { statusPillClass } from "../utils/taskUtils";

function countBy(list, keyFn) {
  return list.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Dashboard: high-level project/task overview and quick status breakdown. */
  const { backend } = useAuth();
  const toast = useToast();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [p, t] = await Promise.all([backend.projects.list(), backend.tasks.list()]);
        if (!alive) return;
        setProjects(Array.isArray(p) ? p : []);
        setTasks(Array.isArray(t) ? t : []);
      } catch (e) {
        toast.error("Failed to load dashboard", e?.message || "Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [backend, toast]);

  const tasksByStatus = useMemo(() => countBy(tasks, (t) => t.status || "Unspecified"), [tasks]);
  const done = tasks.filter((t) => t.status === "Done").length;
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Dashboard</h1>
          <p className="pageSubtitle">Overview of your team’s work.</p>
        </div>
        <div className="pill pillPrimary">
          <Icon name="spark" /> Progress: {progress}%
        </div>
      </div>

      <div className="grid grid3">
        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Projects</h3>
            <span className="pill">{projects.length}</span>
          </div>
          <div className="cardMeta">Active projects in your workspace.</div>
        </div>

        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Tasks</h3>
            <span className="pill">{tasks.length}</span>
          </div>
          <div className="cardMeta">Total tasks (all statuses).</div>
        </div>

        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Completed</h3>
            <span className="pill pillAccent">{done}</span>
          </div>
          <div className="cardMeta">Tasks marked as Done.</div>
        </div>
      </div>

      <div className="hr" />

      <div className="grid grid2">
        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Status breakdown</h3>
            <span className="cardMeta">{loading ? "Loading…" : "Updated just now"}</span>
          </div>

          {Object.keys(tasksByStatus).length === 0 ? (
            <div className="small">No tasks found yet.</div>
          ) : (
            <div className="grid" style={{ gap: 8 }}>
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <div
                  key={status}
                  style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
                >
                  <span className={statusPillClass(status)}>{status}</span>
                  <span className="pill">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">What to do next</h3>
            <span className="cardMeta">
              Tip: use <span className="kbd">Quick search</span> in the top bar
            </span>
          </div>

          <ol style={{ margin: 0, paddingLeft: 18, color: "#374151", fontSize: 13 }}>
            <li style={{ marginBottom: 8 }}>
              Create a project, then add tasks with due dates and priority.
            </li>
            <li style={{ marginBottom: 8 }}>
              Filter tasks by status/priority to find what needs attention.
            </li>
            <li>Update your profile details for clearer assignment.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
