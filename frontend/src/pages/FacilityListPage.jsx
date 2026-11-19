import { useEffect, useMemo, useState } from "react";

import { getFacilities } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { RouteLink } from "../components/AppLayout";
import FacilityCard from "../components/FacilityCard";
import { ErrorState, LoadingState } from "../components/PageState";
import { bookingModes, facilityBookingMode } from "../facilityBooking";
import "../facility.css";

export default function FacilityListPage({ teachingOnly = false }) {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getFacilities()
      .then((data) => {
        if (active) setFacilities(data);
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
  }, [requestKey]);

  const directory = useMemo(
    () => teachingOnly ? facilities.filter((facility) => facilityBookingMode(facility) === "teaching") : facilities,
    [facilities, teachingOnly],
  );
  const categories = useMemo(
    () => [...new Set(directory.map((facility) => facility.category).filter(Boolean))].sort(),
    [directory],
  );
  const selectedCategory = categories.includes(category) ? category : "";
  const filteredFacilities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return directory.filter((facility) => {
      if (selectedCategory && facility.category !== selectedCategory) return false;
      const searchable = [facility.name, facility.location, facility.description, facility.category,
        bookingModes[facilityBookingMode(facility)], ...(facility.amenities || [])];
      return searchable.join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [directory, query, selectedCategory]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />;

  return (
    <section className="facility-list-page catalog-page">
      <header className="directory-heading">
        <div>
          <p className="eyebrow">{teachingOnly ? "FOR TEACHERS" : "CAMPUS DIRECTORY"}</p>
          <h1>{teachingOnly ? "A whole room for your next class." : "Find a campus space."}</h1>
          <p>{teachingOnly
            ? "Request an entire classroom or lecture hall for a lesson or workshop. Libraries and study areas stay separate."
            : "Find the right fit by capacity, location, and amenities, from a numbered study seat to a teaching hall."}</p>
        </div>
        {!teachingOnly && <RouteLink className="button outline" to="/teaching">Browse teaching spaces</RouteLink>}
      </header>
      {teachingOnly && user?.role !== "teacher" && (
        <aside className="teacher-access-note">
          <p><strong>Whole-room bookings require a teacher account.</strong> The campus team enables teacher access on existing accounts.</p>
          {!user && <RouteLink className="button outline" to={`/login?next=${encodeURIComponent("/teaching")}`}>Sign in</RouteLink>}
        </aside>
      )}
      <div className="catalog-filters" aria-label="Facility filters">
        <label className="directory-search">
          <span>Search facilities</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘projector’, ‘library’, or ‘sports’" />
        </label>
        {categories.length > 1 && (
          <label className="catalog-category">
            <span>Facility type</span>
            <select value={selectedCategory} onChange={(event) => setCategory(event.target.value)}>
              <option value="">All types</option>
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        )}
      </div>
      <p className="catalog-count" role="status">
        {filteredFacilities.length === directory.length ? directory.length : `${filteredFacilities.length} of ${directory.length}`} {teachingOnly ? "teaching spaces" : "facilities"}
      </p>
      {filteredFacilities.length ? (
        <div className="facility-grid">
          {filteredFacilities.map((facility) => <FacilityCard key={facility.id} facility={facility} />)}
        </div>
      ) : (
        <div className="empty-state">
          <strong>{directory.length ? "No matching spaces" : "No spaces are listed yet"}</strong>
          {directory.length > 0 && <><p>Try another name, amenity, or facility type.</p><button type="button" onClick={() => { setQuery(""); setCategory(""); }}>Clear filters</button></>}
        </div>
      )}
    </section>
  );
}
