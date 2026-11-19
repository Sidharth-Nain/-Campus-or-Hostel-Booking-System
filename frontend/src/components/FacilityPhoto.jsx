import { useState } from "react";

import { facilityImage } from "../facilityImages";

export default function FacilityPhoto({ facility, lazy = false }) {
  const src = facilityImage(facility);
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || src === failedSrc) {
    return <div className="facility-photo-empty"><span>{src ? "Photo unavailable" : "No photo yet"}</span></div>;
  }

  return (
    <>
      <img src={src} alt="" loading={lazy ? "lazy" : "eager"} decoding="async" onError={() => setFailedSrc(src)} />
      {src.endsWith("/badminton-court.jpg") && (
        <small className="facility-photo-credit">
          <a href="https://commons.wikimedia.org/wiki/File:Badminton_Court_at_IITD.jpg">Ruturajpol</a>
          {" · "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
          {" · Resized"}
        </small>
      )}
    </>
  );
}
