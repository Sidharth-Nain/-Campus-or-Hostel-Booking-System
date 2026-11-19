import { useEffect, useState } from "react";

import { getFacilities } from "../api/client";
import { facilityBookingMode } from "../facilityBooking";
import { RouteLink } from "./AppLayout";
import FacilityPhoto from "./FacilityPhoto";
import "../facility.css";
import "../home-spaces.css";

const PREVIEW_LIMIT = 9;

function SpacePreview({ facility }) {
  const linkTitleId = `home-space-title-${facility.id}`;
  const capacityUnit = facilityBookingMode(facility) === "study_seat" ? "seats" : "people";

  return (
    <li className="home-space-card">
      <div className="home-space-photo">
        <FacilityPhoto facility={facility} lazy />
        <span className="facility-category">{facility.category || "Campus space"}</span>
      </div>
      <RouteLink className="home-space-link" to={`/facilities/${facility.id}`} aria-labelledby={linkTitleId}>
        <h3 id={linkTitleId}>{facility.name}</h3>
        <p>{facility.location}</p>
        <span className="home-space-capacity">Capacity: {facility.capacity} {capacityUnit}</span>
      </RouteLink>
    </li>
  );
}

export default function HomeSpaces() {
  const [result, setResult] = useState({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    getFacilities()
      .then((spaces) => {
        if (!Array.isArray(spaces)) throw new Error("The directory did not return a list of spaces.");
        if (active) setResult({ status: "ready", spaces });
      })
      .catch(() => {
        if (active) setResult({ status: "error" });
      });
    return () => { active = false; };
  }, [attempt]);

  const spaces = result.spaces ?? [];
  const firstSpaces = spaces.slice(0, PREVIEW_LIMIT);
  const additionalSpaces = spaces.slice(PREVIEW_LIMIT);

  function retry() {
    setResult({ status: "loading" });
    setAttempt((previousAttempt) => previousAttempt + 1);
  }

  return (
    <section className="landing-section home-spaces" aria-labelledby="home-spaces-title">
      <header className="landing-section-heading">
        <p className="eyebrow">Campus directory</p>
        <h2 id="home-spaces-title" tabIndex={-1}>Explore campus spaces</h2>
        <p className="muted">Find a study desk, a lab for your project, or a whole room for your next class.</p>
      </header>

      {result.status === "loading" && <p className="home-spaces-message" role="status">Loading campus spaces…</p>}
      {result.status === "error" && (
        <div className="home-spaces-message">
          <p role="alert">We couldn’t load campus spaces right now.</p>
          <button type="button" className="button outline" onClick={retry}>Try again</button>
        </div>
      )}
      {result.status === "ready" && (spaces.length ? (
        <>
          <ul className="home-space-grid">
            {firstSpaces.map((facility) => <SpacePreview key={facility.id} facility={facility} />)}
          </ul>
          {additionalSpaces.length > 0 && (
            <>
              <div className="home-spaces-controls">
                <button
                  type="button"
                  className="button outline"
                  aria-expanded={expanded}
                  aria-controls="home-spaces-more"
                  onClick={() => setExpanded((previousExpanded) => !previousExpanded)}
                >
                  {expanded ? "Show fewer spaces" : "Show more spaces"}
                </button>
              </div>
              <div id="home-spaces-more" hidden={!expanded}>
                {expanded && (
                  <ul className="home-space-grid" aria-label="More campus spaces">
                    {additionalSpaces.map((facility) => <SpacePreview key={facility.id} facility={facility} />)}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      ) : <p className="home-spaces-message" role="status">There are no campus spaces listed right now.</p>)}
    </section>
  );
}
