import { RouteLink } from "./AppLayout";
import { facilityImage } from "../facilityImages";

export default function FacilityCard({ facility, featured = false }) {
  return (
    <article className={`facility-card card ${featured ? "featured" : ""}`}>
      <div className="facility-image">
        <img src={facilityImage(facility.name)} alt={facility.name} loading="lazy" />
        <span className="active-badge">Available</span>
      </div>
      <div className="facility-content">
        <p className="eyebrow">{facility.location}</p>
        <h2>{facility.name}</h2>
        <p>{facility.description}</p>
        <div className="facility-meta"><span>{facility.capacity} people</span><span>Active facility</span></div>
        <RouteLink className="button outline" to={`/facilities/${facility.id}`}>View details</RouteLink>
      </div>
    </article>
  );
}
