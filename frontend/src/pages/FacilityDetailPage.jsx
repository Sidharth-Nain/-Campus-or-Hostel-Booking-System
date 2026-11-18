import { useEffect, useState } from "react";

import { getFacility } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import BookingPanel from "../components/BookingPanel";
import { ErrorState, LoadingState } from "../components/PageState";
import { RouteLink } from "../components/AppLayout";
import { facilityImage } from "../facilityImages";

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

  return (
    <section className="facility-detail-page">
      <RouteLink className="back-link" to="/facilities">← Back to all facilities</RouteLink>
      <div className="detail-layout">
        <div className="detail-image"><img src={facilityImage(facility.name)} alt={facility.name} /><span className="active-badge">Available</span></div>
        <article className="detail-content">
          <p className="eyebrow">{facility.location}</p>
          <h1>{facility.name}</h1>
          <p className="detail-description">{facility.description}</p>
          <dl className="detail-facts">
            <div><dt>Capacity</dt><dd>{facility.capacity} people</dd></div>
            <div><dt>Location</dt><dd>{facility.location}</dd></div>
            <div><dt>Status</dt><dd>{facility.is_active ? "Open for requests" : "Unavailable"}</dd></div>
          </dl>
          {user.role === "student" ? (
            <button className="button primary detail-book-button" type="button" onClick={() => document.getElementById("booking-form")?.scrollIntoView({ behavior: "smooth" })}>Request this facility</button>
          ) : (
            <RouteLink className="button primary detail-book-button" to="/admin/bookings">Review booking requests</RouteLink>
          )}
        </article>
      </div>
      <BookingPanel facility={facility} />
    </section>
  );
}
