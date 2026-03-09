import React, { useState } from "react";
import { useAuth } from "../../state/auth/AuthContext";
import { useToast } from "../../state/toast/ToastContext";

// PUBLIC_INTERFACE
export function ProfilePage() {
  /** Profile page: view/update user details. */
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.role || "member");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        role: role.trim()
      });
      toast.success("Profile saved", updated.name);
    } catch (e) {
      toast.error("Save failed", e?.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="pageTitle">Profile</h1>
          <p className="pageSubtitle">Manage your personal details.</p>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Your details</h3>
            <span className="cardMeta">Used for task assignment.</span>
          </div>

          <div className="formGrid">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="label">Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="label">Role</label>
              <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>

            <div className="btnRow" style={{ justifyContent: "flex-end" }}>
              <button className="btn btnPrimary" onClick={onSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeaderRow">
            <h3 className="cardTitle">Account</h3>
            <span className="cardMeta">Security & session</span>
          </div>
          <div className="small">
            Token is stored in <span className="kbd">localStorage</span> and attached as{" "}
            <span className="kbd">Authorization: Bearer &lt;token&gt;</span> for API requests.
          </div>
          <div className="hr" />
          <div className="small">
            Current user id: <span className="kbd">{user?.id || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
