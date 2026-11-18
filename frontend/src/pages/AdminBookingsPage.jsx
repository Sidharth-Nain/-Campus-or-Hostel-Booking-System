import { useCallback, useEffect, useState } from "react";

import { approveBooking, getAdminBookings, rejectBooking } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ErrorState, LoadingState } from "../components/PageState";
import { formatBookingRange } from "../dateTime";

const FILTERS = ["pending", "all", "approved", "rejected", "cancelled"];

export default function AdminBookingsPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [notice, setNotice] = useState("");

  const loadBookings = useCallback(async () => {
    if (user.role !== "admin") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setBookings(await getAdminBookings(token, filter));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filter, token, user.role]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  if (user.role !== "admin") {
    return <section className="admin-access card"><span>403</span><p className="eyebrow">RESTRICTED WORKSPACE</p><h1>Administrator access required.</h1><p>Only an administrator can review other students’ booking requests.</p></section>;
  }
  if (loading) return <LoadingState message="Loading the administrator review queue…" />;
  if (error) return <ErrorState message={error} onRetry={loadBookings} />;

  async function decide(booking, decision) {
    setActionId(booking.id);
    setNotice("");
    try {
      const updated = decision === "approved"
        ? await approveBooking(token, booking.id)
        : await rejectBooking(token, booking.id);
      setBookings((current) => filter === "pending"
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.requester.full_name}’s request was ${decision}. The email notification was processed.`);
    } catch (requestError) {
      setNotice(`Could not ${decision === "approved" ? "approve" : "reject"} this request: ${requestError.message}`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <section className="admin-bookings-page">
      <header className="review-heading">
        <div><p className="eyebrow">ADMINISTRATOR · BOOKING REVIEW</p><h1>Decide what happens <em>next.</em></h1><p>Review the student, space, time, and purpose before making a decision.</p></div>
        <span className="review-count"><strong>{bookings.length}</strong>{filter === "all" ? "Requests" : filter}</span>
      </header>

      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <div className="booking-filter-row admin-filters" aria-label="Filter review queue">
        {FILTERS.map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" onClick={() => setFilter(item)}>{item}</button>)}
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state bookings-empty"><strong>No {filter} requests.</strong><p>The queue is clear for this status.</p></div>
      ) : (
        <div className="review-grid">
          {bookings.map((booking) => (
            <article className="review-card card" key={booking.id}>
              <div className="review-card-top"><span className={`booking-status ${booking.status}`}>{booking.status}</span><small>Request #{booking.id}</small></div>
              <h2>{booking.facility.name}</h2>
              <p className="review-time">{formatBookingRange(booking.starts_at, booking.ends_at)}</p>
              <dl className="review-facts">
                <div><dt>Student</dt><dd>{booking.requester.full_name}</dd><small>{booking.requester.email}</small></div>
                <div><dt>Location</dt><dd>{booking.facility.location}</dd></div>
                <div className="review-purpose"><dt>Purpose</dt><dd>{booking.purpose}</dd></div>
              </dl>
              {booking.status === "pending" && (
                <div className="review-actions">
                  <button className="button primary" type="button" onClick={() => decide(booking, "approved")} disabled={actionId === booking.id}>{actionId === booking.id ? "Saving…" : "Approve"}</button>
                  <button className="button outline" type="button" onClick={() => decide(booking, "rejected")} disabled={actionId === booking.id}>Reject</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
