import { useCallback, useEffect, useMemo, useState } from "react";

import { cancelBooking, getMyBookings } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { RouteLink } from "../components/AppLayout";
import { ErrorState, LoadingState } from "../components/PageState";
import { formatBookingRange } from "../dateTime";

const FILTERS = ["all", "pending", "approved", "rejected", "cancelled"];

export default function MyBookingsPage() {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [notice, setNotice] = useState("");
  const canBook = user.role === "student" || user.role === "teacher";
  const directory = user.role === "teacher" ? "/teaching" : "/facilities";

  const loadBookings = useCallback(async () => {
    if (!canBook) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setBookings(await getMyBookings(token));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token, canBook]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const visibleBookings = useMemo(
    () => filter === "all" ? bookings : bookings.filter((booking) => booking.status === filter),
    [bookings, filter],
  );

  if (!canBook) {
    return <section className="admin-access card"><span>DH</span><p className="eyebrow">PERSONAL BOOKINGS</p><h1>Manage requests from the review queue.</h1><p>This page shows personal bookings for students and teachers.</p><RouteLink className="button primary" to="/admin/bookings">Open review queue</RouteLink></section>;
  }
  if (loading) return <LoadingState message="Loading your booking history…" />;
  if (error) return <ErrorState message={error} onRetry={loadBookings} />;

  async function handleCancel(booking) {
    setActionId(booking.id);
    setNotice("");
    try {
      const updated = await cancelBooking(token, booking.id);
      setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.facility.name} was cancelled.`);
    } catch (requestError) {
      setNotice(`Could not cancel this booking: ${requestError.message}`);
    } finally {
      setActionId(null);
      setConfirmingId(null);
    }
  }

  return (
    <section className="bookings-page">
      <header className="bookings-heading">
        <div><p className="eyebrow">YOUR CAMPUS SCHEDULE</p><h1>My <em>bookings.</em></h1><p>Find your seat number, check a venue request, or cancel a reservation.</p></div>
        <RouteLink className="button primary" to={directory}>Find another space</RouteLink>
      </header>

      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <div className="booking-filter-row" aria-label="Filter bookings">
        {FILTERS.map((item) => <button key={item} className={filter === item ? "active" : ""} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item === "approved" ? "confirmed" : item}</button>)}
      </div>

      {visibleBookings.length === 0 ? (
        <div className="empty-state bookings-empty"><strong>No bookings match this view.</strong><p>Explore the directory when you are ready to reserve a space.</p><RouteLink className="inline-link" to={directory}>{user.role === "teacher" ? "Browse teaching spaces" : "Browse facilities"}</RouteLink></div>
      ) : (
        <div className="booking-list">
          {visibleBookings.map((booking) => (
            <article className="booking-record card" key={booking.id}>
              <div className="booking-date-tile"><span>{new Date(booking.starts_at).toLocaleString(undefined, { month: "short" })}</span><strong>{new Date(booking.starts_at).getDate()}</strong></div>
              <div className="booking-record-copy">
                <div className="managed-title-row"><h2>{booking.facility.name}</h2><span className={`booking-status ${booking.status}`}>{booking.status === "approved" ? "confirmed" : booking.status}</span></div>
                <strong>{booking.seat_number ? `Seat ${booking.seat_number}` : "Whole space"}</strong>
                <p className="booking-time">{formatBookingRange(booking.starts_at, booking.ends_at)}</p>
                <p>{booking.purpose}</p>
                <small>{booking.facility.location}</small>
              </div>
              <div className="booking-record-action">
                {["pending", "approved"].includes(booking.status) && (
                  confirmingId === booking.id ? (
                    <div className="confirm-actions"><small>Cancel this booking?</small><button type="button" onClick={() => handleCancel(booking)} disabled={actionId === booking.id}>{actionId === booking.id ? "Cancelling…" : "Yes, cancel"}</button><button type="button" onClick={() => setConfirmingId(null)}>Keep it</button></div>
                  ) : <button className="text-button danger" type="button" onClick={() => setConfirmingId(booking.id)}>Cancel booking</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
