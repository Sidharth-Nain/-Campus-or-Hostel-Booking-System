import { useEffect, useState } from "react";

import { getFacility } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import BookingPanel from "../components/BookingPanel";
import FacilityPhoto from "../components/FacilityPhoto";
import { ErrorState, LoadingState } from "../components/PageState";
import { RouteLink } from "../components/AppLayout";
import { bookingModes, canRequestFacility, facilityBookingMode } from "../facilityBooking";
import "../facility.css";

function FacilityAction({ facility, role }) {
  const mode = facilityBookingMode(facility);
  const buttonClass = "button primary detail-book-button";

  if (role === "admin") return <RouteLink className={buttonClass} to="/admin/bookings">Review booking requests</RouteLink>;
  if (mode === "study_seat" && role !== "teacher") {
    return <RouteLink className={buttonClass} to={`/plans/${facility.id}`}>See compatible study passes</RouteLink>;
  }
  if (!role) {
    const next = encodeURIComponent(`/facilities/${facility.id}`);
    return <RouteLink className={buttonClass} to={`/login?next=${next}`}>Sign in to request a booking</RouteLink>;
  }
  if (role === "teacher" && mode !== "teaching") {
    return <RouteLink className={buttonClass} to="/teaching">Find a teaching space</RouteLink>;
  }
  if (!canRequestFacility(role, facility)) return null;

  return (
    <button className={buttonClass} type="button" onClick={() => document.getElementById("booking-form")?.focus()}>
      {mode === "teaching" ? "Request the whole room" : "Request this facility"}
    </button>
  );
}

export default function FacilityDetailPage({ facilityId }) {
  const { user } = useAuth();
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getFacility(facilityId)
      .then((data) => {
        if (active) setFacility(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [facilityId, requestKey]);

  if (loading) return <LoadingState message="Loading facility details…" />;
  if (error) return <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />;

  const mode = facilityBookingMode(facility);
  const role = user?.role;
  const amenities = facility.amenities || [];
  return (
    <section className="facility-detail-page catalog-detail">
      <RouteLink className="back-link" to={mode === "teaching" ? "/teaching" : "/facilities"}>
        {mode === "teaching" ? "All teaching spaces" : "All facilities"}
      </RouteLink>
      <div className="detail-layout">
        <div className="detail-image">
          <FacilityPhoto facility={facility} />
          <span className="facility-category">{facility.category || "Campus space"}</span>
        </div>
        <article className="detail-content">
          <p className="eyebrow">{bookingModes[mode]}</p>
          <h1>{facility.name}</h1>
          <p className="detail-description">{facility.description}</p>
          <dl className="detail-facts">
            <div><dt>Capacity</dt><dd>{facility.capacity} {mode === "study_seat" ? "numbered seats" : "people"}</dd></div>
            <div><dt>Location</dt><dd>{facility.location}</dd></div>
          </dl>
          <div className="catalog-amenities">
            <h2>Amenities</h2>
            {amenities.length ? <ul className="amenity-list">{amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
              : <p className="muted">Amenities have not been listed for this space yet.</p>}
          </div>
          {mode === "teaching" && <p className="facility-use-note">Teachers request the full space for a class or workshop. The room is reserved for that session once an administrator approves it.</p>}
          {mode === "study_room" && <p className="facility-use-note">For study only. Class and workshop bookings must use a designated teaching space.</p>}
          {mode === "study_seat" && <p className="facility-use-note">Student study passes hold one numbered seat for the full plan term. They do not reserve the whole room.</p>}
          <FacilityAction facility={facility} role={role} />
        </article>
      </div>
      {canRequestFacility(role, facility) && <BookingPanel key={facility.id} facility={facility} />}
    </section>
  );
}
