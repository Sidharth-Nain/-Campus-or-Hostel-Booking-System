import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFacility,
  deactivateFacility,
  getAdminFacilities,
  updateFacility,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorState, LoadingState } from "../components/PageState";

const EMPTY_FORM = {
  name: "",
  description: "",
  capacity: "",
  location: "",
};

function AdminAccessRequired() {
  return (
    <section className="admin-access card">
      <span>403</span>
      <p className="eyebrow">RESTRICTED WORKSPACE</p>
      <h1>Administrator access required.</h1>
      <p>Your account can browse facilities, but only a CampusFlow administrator can change the directory.</p>
    </section>
  );
}

export default function AdminFacilitiesPage() {
  const { token, user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionId, setActionId] = useState(null);

  const loadFacilities = useCallback(async () => {
    if (user.role !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      setFacilities(await getAdminFacilities(token));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }, [token, user.role]);

  useEffect(() => {
    loadFacilities();
  }, [loadFacilities]);

  const activeCount = useMemo(
    () => facilities.filter((facility) => facility.is_active).length,
    [facilities],
  );

  if (user.role !== "admin") return <AdminAccessRequired />;
  if (loading) return <LoadingState message="Loading the facility management workspace…" />;
  if (loadError) return <ErrorState message={loadError} onRetry={loadFacilities} />;

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
  }

  function beginEdit(facility) {
    setEditingId(facility.id);
    setForm({
      name: facility.name,
      description: facility.description,
      capacity: String(facility.capacity),
      location: facility.location,
    });
    setFormError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    setNotice("");
    const payload = { ...form, capacity: Number(form.capacity) };

    try {
      const saved = editingId
        ? await updateFacility(token, editingId, payload)
        : await createFacility(token, payload);
      setFacilities((current) => {
        const next = editingId
          ? current.map((facility) => (facility.id === saved.id ? saved : facility))
          : [saved, ...current];
        return next.sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name));
      });
      setNotice(editingId ? `${saved.name} was updated.` : `${saved.name} was added to the directory.`);
      resetForm();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(facility) {
    setActionId(facility.id);
    setNotice("");
    try {
      const updated = await deactivateFacility(token, facility.id);
      setFacilities((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`${updated.name} is now hidden from students.`);
      if (editingId === facility.id) resetForm();
    } catch (error) {
      setNotice(`Could not deactivate ${facility.name}: ${error.message}`);
    } finally {
      setActionId(null);
      setConfirmingId(null);
    }
  }

  async function handleRestore(facility) {
    setActionId(facility.id);
    setNotice("");
    try {
      const updated = await updateFacility(token, facility.id, { is_active: true });
      setFacilities((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`${updated.name} is visible to students again.`);
    } catch (error) {
      setNotice(`Could not restore ${facility.name}: ${error.message}`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="admin-facilities-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">ADMINISTRATOR · FACILITY MANAGEMENT</p>
          <h1>Shape the campus <em>directory.</em></h1>
          <p>Add spaces, keep their details accurate, and control what students can book.</p>
        </div>
        <div className="admin-stats" aria-label="Facility summary">
          <span><strong>{activeCount}</strong>Active</span>
          <span><strong>{facilities.length - activeCount}</strong>Inactive</span>
        </div>
      </header>

      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <div className="admin-workspace">
        <aside className="facility-editor card">
          <div className="editor-heading">
            <div>
              <p className="eyebrow">{editingId ? "EDIT FACILITY" : "NEW FACILITY"}</p>
              <h2>{editingId ? "Update this space" : "Add a campus space"}</h2>
            </div>
            {editingId && <button type="button" className="text-button" onClick={resetForm}>Cancel</button>}
          </div>
          <form className="facility-form" onSubmit={handleSubmit}>
            <label>
              Facility name
              <input name="name" value={form.name} onChange={updateForm} minLength="2" maxLength="120" required placeholder="e.g. Media Studio" />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={updateForm} minLength="2" maxLength="160" required placeholder="e.g. Arts Block · Floor 2" />
            </label>
            <label>
              Capacity
              <input name="capacity" value={form.capacity} onChange={updateForm} type="number" min="1" max="10000" required placeholder="24" />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={updateForm} minLength="10" maxLength="2000" required rows="5" placeholder="Describe the space and what students can use it for." />
            </label>
            {formError && <p className="form-message error" role="alert">{formError}</p>}
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Create facility"}
            </button>
          </form>
        </aside>

        <div className="managed-directory">
          <div className="managed-heading">
            <div><p className="eyebrow">ALL SPACES</p><h2>Facility directory</h2></div>
            <span>{facilities.length} total</span>
          </div>
          {facilities.length === 0 ? (
            <div className="empty-state"><strong>No facilities yet.</strong><p>Create the first campus space using the form.</p></div>
          ) : facilities.map((facility) => (
            <article className={`managed-facility card ${facility.is_active ? "" : "inactive"}`} key={facility.id}>
              <div className="managed-facility-number">{String(facility.id).padStart(2, "0")}</div>
              <div className="managed-facility-copy">
                <div className="managed-title-row">
                  <h3>{facility.name}</h3>
                  <span className={facility.is_active ? "status-active" : "status-inactive"}>
                    {facility.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p>{facility.description}</p>
                <div className="managed-meta"><span>{facility.location}</span><span>Capacity {facility.capacity}</span></div>
              </div>
              <div className="managed-actions">
                <button type="button" className="button outline compact" onClick={() => beginEdit(facility)}>Edit</button>
                {facility.is_active ? (
                  confirmingId === facility.id ? (
                    <div className="confirm-actions">
                      <small>Hide from students?</small>
                      <button type="button" onClick={() => handleDeactivate(facility)} disabled={actionId === facility.id}>Yes, hide</button>
                      <button type="button" onClick={() => setConfirmingId(null)}>Keep</button>
                    </div>
                  ) : (
                    <button type="button" className="text-button danger" onClick={() => setConfirmingId(facility.id)}>Deactivate</button>
                  )
                ) : (
                  <button type="button" className="text-button restore" onClick={() => handleRestore(facility)} disabled={actionId === facility.id}>
                    {actionId === facility.id ? "Restoring…" : "Restore"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
