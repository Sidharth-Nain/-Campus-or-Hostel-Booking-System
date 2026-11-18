import { useState } from "react";

import { checkBookingAvailability, createBooking } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { minimumLocalDateTime, toIsoDateTime } from "../dateTime";
import { RouteLink } from "./AppLayout";

const INITIAL_FORM = { starts_at: "", ends_at: "", purpose: "" };

export default function BookingPanel({ facility }) {
  const { token, user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  if (user.role === "admin") {
    return (
      <aside className="booking-panel admin-booking-callout">
        <div><p className="eyebrow">ADMINISTRATOR VIEW</p><h2>Ready to review requests?</h2></div>
        <p>Students create requests from this page. Open the review queue to approve or reject them.</p>
        <RouteLink className="button primary" to="/admin/bookings">Open review queue</RouteLink>
      </aside>
    );
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setAvailability(null);
    setCreated(null);
    setError("");
  }

  function buildInterval() {
    const startsAt = toIsoDateTime(form.starts_at);
    const endsAt = toIsoDateTime(form.ends_at);
    if (!startsAt || !endsAt) throw new Error("Choose both a start time and an end time.");
    if (new Date(endsAt) <= new Date(startsAt)) throw new Error("End time must be after the start time.");
    return { facility_id: facility.id, starts_at: startsAt, ends_at: endsAt };
  }

  async function handleAvailability() {
    setChecking(true);
    setError("");
    setCreated(null);
    try {
      const result = await checkBookingAvailability(token, buildInterval());
      setAvailability(result);
    } catch (requestError) {
      setAvailability(null);
      setError(requestError.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!availability?.is_available) {
      setError("Check that this time slot is available before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const booking = await createBooking(token, { ...buildInterval(), purpose: form.purpose });
      setCreated(booking);
      setForm(INITIAL_FORM);
      setAvailability(null);
    } catch (requestError) {
      setError(requestError.message);
      setAvailability(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className="booking-panel" id="booking-form">
      <div className="booking-panel-heading">
        <div><p className="eyebrow">REQUEST THIS SPACE</p><h2>Choose your time</h2></div>
        <span>Maximum 12 hours</span>
      </div>

      {created ? (
        <div className="booking-success" role="status">
          <span>✓</span>
          <div><strong>Request submitted.</strong><p>Your booking is pending administrator review.</p></div>
          <RouteLink className="inline-link" to="/bookings">View My bookings →</RouteLink>
        </div>
      ) : (
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-time-grid">
            <label>Start time<input type="datetime-local" name="starts_at" min={minimumLocalDateTime()} value={form.starts_at} onChange={updateField} required /></label>
            <label>End time<input type="datetime-local" name="ends_at" min={form.starts_at || minimumLocalDateTime()} value={form.ends_at} onChange={updateField} required /></label>
          </div>
          <label>Purpose<textarea name="purpose" value={form.purpose} onChange={updateField} minLength="3" maxLength="500" rows="3" required placeholder="Tell the administrator what you are planning." /></label>

          {availability && (
            <p className={`availability-result ${availability.is_available ? "available" : "unavailable"}`} role="status">
              <span>{availability.is_available ? "✓" : "!"}</span>{availability.message}
            </p>
          )}
          {error && <p className="form-message error" role="alert">{error}</p>}

          <div className="booking-form-actions">
            <button className="button outline" type="button" onClick={handleAvailability} disabled={checking || submitting}>
              {checking ? "Checking…" : "Check availability"}
            </button>
            <button className="button primary" type="submit" disabled={submitting || !availability?.is_available}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
    </aside>
  );
}
