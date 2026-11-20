import { RouteLink } from "./AppLayout";
import FacilityPhoto from "./FacilityPhoto";
import { facilityBookingLabel } from "../facilityBooking";

export default function FacilityCard({ facility }) {
  const amenities = facility.amenities || [];

  return (
    <article className="facility-card card">
      <div className="facility-image">
        <FacilityPhoto facility={facility} lazy />
        <span className="facility-category">{facility.category || "Campus space"}</span>
      </div>
      <div className="facility-content">
        <p className="facility-location">{facility.location}</p>
        <h2>{facility.name}</h2>
        <p>{facility.description}</p>
        {amenities.length > 0 && (
          <ul className="amenity-list" aria-label="Featured amenities">
            {amenities.slice(0, 3).map((amenity) => <li key={amenity}>{amenity}</li>)}
            {amenities.length > 3 && <li>+{amenities.length - 3} more</li>}
          </ul>
        )}
        <div className="facility-meta"><span>{facility.capacity} {facility.seat_layout ? "seats" : "people"}</span><span>{facilityBookingLabel(facility)}</span></div>
        <RouteLink className="button outline" to={`/facilities/${facility.id}`}>View details</RouteLink>
      </div>
    </article>
  );
}
