import { useEffect, useState } from "react";

import { getFacility } from "../api/client";
import { ErrorState, LoadingState } from "../components/PageState";
import { RouteLink } from "../components/AppLayout";
import { facilityImage } from "../facilityImages";

export default function FacilityDetailPage({ facilityId }) {
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
          <div className="detail-next-step"><span>BOOKING FLOW</span><p>Time-slot selection and request submission will be connected in the next scheduled frontend task.</p></div>
        </article>
      </div>
    </section>
  );
}
