import { useState } from "react";

import { checkBookingAvailability, createBooking } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { minimumLocalDateTime, toIsoDateTime } from "../dateTime";
import { facilityBookingMode } from "../facilityBooking";
import { RouteLink } from "./AppLayout";

const INITIAL_FORM = { starts_at: "", ends_at: "", purpose: "" };

export default function BookingPanel({ facility }) {
  const { token } = useAuth();
  const teaching = facilityBookingMode(facility) === "teaching";
  const [form, setForm] = useState(INITIAL_FORM);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name !== "purpose") setAvailability(null);
    setError("");
  }

  function buildInterval() {
    const startsAt = toIsoDateTime(form.starts_at);
    const endsAt = toIsoDateTime(form.ends_at);
    if (!startsAt || !endsAt) throw new Error("Choose both a start time and an end time.");
    const start = Date.parse(startsAt);
    const end = Date.parse(endsAt);
    if (start <= Date.now()) throw new Error("Choose a start time in the future.");
    if (end <= start) throw new Error("End time must be after the start time.");
    if (end - start > 12 * 60 * 60 * 1000) throw new Error("Bookings can last up to 12 hours.");
    return { facility_id: facility.id, starts_at: startsAt, ends_at: endsAt };
  }

  async function handleAvailability() {
    setChecking(true);
    setError("");
    setAvailability(null);
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
    const purpose = form.purpose.trim();
    if (purpose.length < 3) {
      setError("Enter at least three characters for the booking purpose.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const booking = await createBooking(token, { ...buildInterval(), purpose });
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
    <section className="booking-panel catalog-booking-panel" id="booking-form" tabIndex={-1} aria-labelledby="booking-panel-title">
      <div className="booking-panel-heading">
        <div><p className="eyebrow">{teaching ? "TEACHER · WHOLE ROOM" : "SINGLE BOOKING"}</p><h2 id="booking-panel-title">{teaching ? "Schedule a teaching session" : "Choose your time"}</h2></div>
        <p className="booking-panel-copy">
          {teaching ? "Check the room for your lesson or workshop, then send a request for approval." : "Check whether the space is free, then send a request for approval."} Times use your device’s local time.
        </p>
        <span>Maximum 12 hours</span>
      </div>

      {created ? (
        <div className="booking-success" role="status">
          <span>✓</span>
          <div><strong>Request submitted.</strong><p>Your booking is pending administrator review.</p></div>
          <RouteLink className="inline-link" to="/bookings">View my bookings</RouteLink>
        </div>
      ) : (
        <form className="booking-form" onSubmit={handleSubmit}>
          <div className="booking-time-grid">
            <label>Start time<input type="datetime-local" name="starts_at" min={minimumLocalDateTime()} value={form.starts_at} onChange={updateField} disabled={checking || submitting} required /></label>
            <label>End time<input type="datetime-local" name="ends_at" min={form.starts_at || minimumLocalDateTime()} value={form.ends_at} onChange={updateField} disabled={checking || submitting} required /></label>
          </div>
          <label>Purpose<textarea name="purpose" value={form.purpose} onChange={updateField} minLength="3" maxLength="500" rows="3" disabled={checking || submitting} required placeholder={teaching ? "For example: Introductory AI workshop for 30 students" : "Tell the administrator what you are planning."} /></label>

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
            <button className="button primary" type="submit" disabled={checking || submitting || !availability?.is_available}>
              {submitting ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
