import { useEffect, useRef, useState } from "react";

import { checkBookingAvailability, createBooking } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { formatBookingRange, minimumLocalDateTime, toIsoDateTime } from "../dateTime";
import { facilityBookingMode, usesSeatMap } from "../facilityBooking";
import { RouteLink } from "./AppLayout";
import SeatFloorPlan from "./SeatFloorPlan";

const INITIAL_FORM = { starts_at: "", ends_at: "", purpose: "" };

export default function BookingPanel({ facility, onFacilityChange }) {
  const { token, user } = useAuth();
  const seatBooking = usesSeatMap(user?.role, facility);
  const teaching = !seatBooking && facilityBookingMode(facility) === "teaching";
  const venue = facility.name.match(/\b(ground|court|hall|classroom|room|field|pitch)\b/i)?.[0].toLowerCase() || "space";
  const [form, setForm] = useState(INITIAL_FORM);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const resultRef = useRef(null);
  const receiptRef = useRef(null);
  const busy = checking || submitting;

  useEffect(() => {
    if (created) receiptRef.current?.focus();
    else if (availability) resultRef.current?.focus();
  }, [availability, created]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name !== "purpose") {
      setAvailability(null);
      setSelectedSeat(null);
    }
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

  async function loadAvailability() {
    const result = await checkBookingAvailability(token, buildInterval());
    if (Array.isArray(result.available_seats) !== seatBooking) {
      onFacilityChange();
      return;
    }
    setAvailability(result);
  }

  async function handleAvailability(event) {
    event.preventDefault();
    if (busy) return;
    setChecking(true);
    setError("");
    setAvailability(null);
    setSelectedSeat(null);
    try {
      await loadAvailability();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy || !availability?.is_available || (seatBooking && !selectedSeat)) return;
    const purpose = form.purpose.trim();
    if (!seatBooking && purpose.length < 3) {
      setError("Enter at least three characters for the booking purpose.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const selection = seatBooking ? { seat_number: selectedSeat } : { purpose };
      setCreated(await createBooking(token, { ...buildInterval(), ...selection }));
    } catch (requestError) {
      setError(requestError.message);
      if (requestError.status === 409) {
        setSelectedSeat(null);
        try {
          await loadAvailability();
        } catch {
          setAvailability(null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="reservation-panel" aria-labelledby="booking-panel-title">
        <header className="booking-panel-heading">
          <svg className="reservation-clock" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
          <h2 id="booking-panel-title">{created ? "Booking update" : seatBooking ? "Find a seat" : `Request the ${venue}`}</h2>
        </header>
        {created ? (
          <div className="booking-success" role="status" tabIndex={-1} ref={receiptRef}>
            <div>
              <strong>{seatBooking ? `Seat ${created.seat_number} confirmed` : "Request sent · Pending approval"}</strong>
              <p>{facility.name}</p>
              <p>{formatBookingRange(created.starts_at, created.ends_at)}</p>
            </div>
            <RouteLink className="inline-link" to="/bookings">View my bookings</RouteLink>
          </div>
        ) : (
          <>
            <form className="booking-form time-lookup" onSubmit={handleAvailability}>
              <div className="booking-time-grid">
                <label>Start date and time<input type="datetime-local" name="starts_at" min={minimumLocalDateTime()} value={form.starts_at} onChange={updateField} disabled={busy} required /></label>
                <label>End date and time<input type="datetime-local" name="ends_at" min={form.starts_at || minimumLocalDateTime()} value={form.ends_at} onChange={updateField} disabled={busy} required /></label>
              </div>
              <div className="time-lookup-actions">
                <p>Local time · Up to 12 hours</p>
                <button className="button primary" type="submit" disabled={busy}>{checking ? "Checking…" : seatBooking ? "Find a seat" : "Check availability"}</button>
              </div>
            </form>
            {error && !(availability && seatBooking) && <p className="form-message error booking-error" role="alert">{error}</p>}
            {availability && !seatBooking && (
              <div className="whole-confirmation">
                <p className={`availability-result ${availability.is_available ? "available" : "unavailable"}`} role="status" tabIndex={-1} ref={resultRef}>
                  {availability.is_available ? `${facility.name} is available to request.` : availability.message}
                  <br />{formatBookingRange(availability.starts_at, availability.ends_at)}
                </p>
                {availability.is_available && (
                  <form className="booking-form" onSubmit={handleSubmit}>
                    <label>Purpose<textarea name="purpose" value={form.purpose} onChange={updateField} minLength="3" maxLength="500" rows="2" disabled={busy} required placeholder={teaching ? "What class or workshop are you planning?" : `How will you use the ${venue}?`} /></label>
                    <button className="button primary" type="submit" disabled={busy}>{submitting ? "Sending…" : "Send request"}</button>
                  </form>
                )}
              </div>
            )}
          </>
        )}
      </section>
      {!created && availability && seatBooking && (
        <section className="booking-results" aria-label={`Available seats in ${facility.name}`} tabIndex={-1} ref={resultRef}>
          {error && <p className="form-message error booking-error" role="alert">{error}</p>}
          <form className="seat-confirmation" onSubmit={handleSubmit}>
            <SeatFloorPlan facility={{ ...facility, capacity: availability.seat_capacity ?? facility.capacity }} availableSeats={availability.available_seats} selected={selectedSeat}
              onSelect={(number) => { setSelectedSeat(number); setError(""); }} disabled={busy || !availability.is_available} />
            <aside className="seat-ticket" aria-label="Booking summary">
              <h3 aria-live="polite">{selectedSeat ? `Seat ${selectedSeat}` : "Select a seat"}</h3>
              <p>{facility.name}</p><p>{formatBookingRange(availability.starts_at, availability.ends_at)}</p>
              {availability.is_available
                ? <small>Your seat is confirmed as soon as you book.</small>
                : <p className="seat-notice" role="status">{availability.message}</p>}
              <button className="button primary" type="submit" disabled={busy || !availability.is_available || !selectedSeat}>
                {submitting ? "Booking…" : selectedSeat ? `Book seat ${selectedSeat}` : "Book seat"}
              </button>
            </aside>
          </form>
        </section>
      )}
    </>
  );
}
