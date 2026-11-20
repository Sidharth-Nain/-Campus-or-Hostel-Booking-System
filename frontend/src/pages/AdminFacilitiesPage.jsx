import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createFacility,
  deactivateFacility,
  getAdminFacilities,
  updateFacility,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BRAND_NAME } from "../brand";
import { ErrorState, LoadingState } from "../components/PageState";
import { facilityBookingLabel, facilityBookingMode } from "../facilityBooking";

const EMPTY_FORM = {
  name: "",
  description: "",
  capacity: "",
  location: "",
  category: "General",
  amenities: "",
  booking_mode: "standard",
  seat_layout: "",
  seat_tier: "1",
};

const SEAT_TIER_NAMES = ["Focus Week", "Study Sprint", "Campus Desk", "Studio Desk"];
const BOOKING_TYPES = {
  standard: "Student space",
  teaching: "Teaching room or hall",
  study_room: "Study area",
  study_seat: "Study area with seat passes",
};
const SEAT_LAYOUTS = { lab: "Lab workstations", library: "Library desks", classroom: "Classroom rows", studio: "Studio worktables" };

function AdminAccessRequired() {
  return (
    <section className="admin-access card">
      <span>403</span>
      <p className="eyebrow">RESTRICTED WORKSPACE</p>
      <h1>Administrator access required.</h1>
      <p>Your account can browse facilities, but only a {BRAND_NAME} administrator can change the directory.</p>
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
  const seatSpace = form.booking_mode === "study_seat";

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
      category: facility.category || "General",
      amenities: (facility.amenities || []).join("\n"),
      booking_mode: facilityBookingMode(facility),
      seat_layout: facility.seat_layout || "",
      seat_tier: String(facility.seat_tier || 1),
    });
    setFormError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateForm(event) {
    const { name, value } = event.target;
    if (name === "booking_mode") {
      const defaultLayout = { standard: "", teaching: "", study_room: "library", study_seat: "library" };
      setForm((current) => ({ ...current, booking_mode: value, seat_layout: defaultLayout[value] }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setNotice("");
    const amenities = [...new Set(form.amenities.split("\n").map((amenity) => amenity.trim()).filter(Boolean))];
    if (amenities.length > 12 || amenities.some((amenity) => amenity.length > 60)) {
      setFormError("List up to 12 amenities, with no more than 60 characters per amenity.");
      return;
    }
    const payload = {
      name: form.name,
      description: form.description,
      capacity: Number(form.capacity),
      location: form.location,
      category: form.category,
      amenities,
    };
    if (!editingId) {
      payload.booking_mode = form.booking_mode;
      payload.seat_layout = form.seat_layout || null;
      if (seatSpace) payload.seat_tier = Number(form.seat_tier);
    }
    setSaving(true);

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
      setNotice(`${updated.name} is now hidden from the public directory.`);
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
      setNotice(`${updated.name} is visible in the public directory again.`);
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
          <p>Manage facility details and what students and teachers can reserve.</p>
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
              Facility category
              <input name="category" value={form.category} onChange={updateForm} minLength="2" maxLength="40" required placeholder="e.g. Teaching" />
            </label>
            <label>
              Booking type
              <select name="booking_mode" value={form.booking_mode} onChange={updateForm} disabled={Boolean(editingId)}>
                {Object.entries(BOOKING_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {editingId && <small>The booking type is fixed after creation.</small>}
            </label>
            <label>
              Student seat map
              <select name="seat_layout" value={form.seat_layout} onChange={updateForm} disabled={Boolean(editingId)}>
                {["standard", "teaching"].includes(form.booking_mode) && <option value="">Whole space only</option>}
                {Object.entries(SEAT_LAYOUTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <small>{editingId ? "The seat map is fixed after creation." : "A seat map lets students book individual seats instantly."}</small>
            </label>
            {seatSpace && (
              <label>
                Minimum seat pass tier
                <select name="seat_tier" value={form.seat_tier} onChange={updateForm} disabled={Boolean(editingId)}>
                  {SEAT_TIER_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                </select>
                {editingId && <small>The seat count and plan tier are fixed after creation.</small>}
              </label>
            )}
            <label>
              {form.seat_layout ? "Numbered seats" : "Capacity"}
              <input name="capacity" value={form.capacity} onChange={updateForm} type="number" min="1" max="10000" required placeholder="24" disabled={Boolean(editingId && seatSpace)} />
            </label>
            <label>
              Description
              <textarea name="description" value={form.description} onChange={updateForm} minLength="10" maxLength="2000" required rows="4" placeholder="Describe the space and how people use it." />
            </label>
            <label>
              Amenities (one per line)
              <textarea name="amenities" value={form.amenities} onChange={updateForm} rows="3" placeholder={"Projector\nWi-Fi\nAir conditioning"} />
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
                <div className="managed-meta">
                  <span>{facility.location}</span><span>{facility.capacity} {facility.seat_layout ? "seats" : "people"}</span>
                  <span>{facility.category}</span><span>{facilityBookingLabel(facility)}</span>
                </div>
              </div>
              <div className="managed-actions">
                <button type="button" className="button outline compact" onClick={() => beginEdit(facility)}>Edit</button>
                {facility.is_active ? (
                  confirmingId === facility.id ? (
                    <div className="confirm-actions">
                      <small>Hide this facility?</small>
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
