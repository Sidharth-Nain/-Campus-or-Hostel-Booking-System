import { useEffect, useState } from "react";

import { getFacility } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import BookingPanel from "../components/BookingPanel";
import FacilityPhoto from "../components/FacilityPhoto";
import { ErrorState, LoadingState } from "../components/PageState";
import { RouteLink } from "../components/AppLayout";
import { canRequestFacility, facilityBookingLabel, facilityBookingMode } from "../facilityBooking";
import "../facility.css";

function FacilityAction({ facility, role }) {
  const mode = facilityBookingMode(facility);
  const buttonClass = "button primary detail-book-button";

  if (role === "admin") return <RouteLink className={buttonClass} to="/admin/bookings">Review booking requests</RouteLink>;
  if (!role) {
    const next = encodeURIComponent(`/facilities/${facility.id}`);
    return <RouteLink className={buttonClass} to={`/login?next=${next}`}>{facility.seat_layout ? "Sign in to book" : "Sign in to request the space"}</RouteLink>;
  }
  if (role === "teacher" && mode !== "teaching") {
    return <RouteLink className={buttonClass} to="/teaching">Find a teaching space</RouteLink>;
  }
  return null;
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
      <RouteLink className="back-link" to={role === "teacher" && mode === "teaching" ? "/teaching" : "/facilities"}>
        {role === "teacher" && mode === "teaching" ? "All teaching spaces" : "All facilities"}
      </RouteLink>
      <div className="detail-layout">
        <div className="detail-image">
          <FacilityPhoto facility={facility} />
          <span className="facility-category">{facility.category || "Campus space"}</span>
        </div>
        <article className="detail-content">
          <p className="eyebrow facility-booking-kind">{facilityBookingLabel(facility)}</p>
          <h1>{facility.name}</h1>
          <p className="detail-description">{facility.description}</p>
          <dl className="detail-facts">
            <div><dt>Capacity</dt><dd>{facility.capacity} {facility.seat_layout ? "numbered seats" : "people"}</dd></div>
            <div><dt>Location</dt><dd>{facility.location}</dd></div>
          </dl>
          <div className="catalog-amenities">
            <h2>Amenities</h2>
            {amenities.length ? <ul className="amenity-list">{amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}</ul>
              : <p className="muted">Amenities have not been listed for this space yet.</p>}
          </div>
          {mode === "teaching" && <p className="facility-use-note">{facility.seat_layout ? "Students can book an individual desk. Teachers can request the whole classroom for a teaching session." : "Verified teachers can request the whole hall for a teaching session. An administrator reviews each request."}</p>}
          {mode === "study_room" && <p className="facility-use-note">Book an individual seat for quiet study.</p>}
          {mode === "study_seat" && <p className="facility-use-note">Book by the hour, or keep the same seat for several days with a <RouteLink className="inline-link" to={`/plans/${facility.id}`}>study pass</RouteLink>.</p>}
          <FacilityAction facility={facility} role={role} />
        </article>
        {canRequestFacility(role, facility) && (
          <BookingPanel key={`${facility.id}-${role}`} facility={facility} onFacilityChange={() => setRequestKey((value) => value + 1)} />
        )}
      </div>
    </section>
  );
}
