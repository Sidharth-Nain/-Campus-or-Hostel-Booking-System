import { useEffect, useMemo, useState } from "react";

import { getFacilities } from "../api/client";
import FacilityCard from "../components/FacilityCard";
import { ErrorState, LoadingState } from "../components/PageState";

export default function FacilityListPage() {
  const [facilities, setFacilities] = useState([]);
  const [query, setQuery] = useState("");
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

  const filteredFacilities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return facilities;
    return facilities.filter((facility) => `${facility.name} ${facility.location} ${facility.description}`.toLowerCase().includes(normalizedQuery));
  }, [facilities, query]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={() => setRequestKey((key) => key + 1)} />;

  return (
    <section className="facility-list-page">
      <header className="directory-heading">
        <div><p className="eyebrow">LIVE FACILITY DIRECTORY</p><h1>Spaces for every kind of day.</h1></div>
        <p>{facilities.length} active facilities are currently available to explore.</p>
      </header>
      <label className="directory-search">
        <span>Search facilities</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, location, or purpose" />
      </label>
      {filteredFacilities.length ? (
        <div className="facility-grid">
          {filteredFacilities.map((facility, index) => <FacilityCard key={facility.id} facility={facility} featured={index === 0 && !query} />)}
        </div>
      ) : (
        <div className="empty-state"><strong>No matching spaces</strong><p>Try another facility name, location, or activity.</p><button type="button" onClick={() => setQuery("")}>Clear search</button></div>
      )}
    </section>
  );
}
