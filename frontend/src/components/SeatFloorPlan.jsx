import { useMemo, useState } from "react";
import "../seat-floor-plan.css";

const FLOORS = {
  lab: { landmark: "Instructor station", podSize: 4 },
  classroom: { landmark: "Teaching board", podSize: 2 },
  library: { landmark: "Bookshelves", podSize: 4 },
  studio: { landmark: "Project wall", podSize: 6 },
  bench: { landmark: "Tool station", podSize: 6 },
  carrel: { landmark: "Reading area", podSize: 2 },
};
const SEATS_PER_SECTION = 48;

function planStyle(facility) {
  if (facility.seat_layout === "lab" && /robotics/i.test(facility.name)) return "bench";
  if (facility.seat_layout === "library" && /carrel/i.test(facility.name)) return "carrel";
  return FLOORS[facility.seat_layout] ? facility.seat_layout : "library";
}

export default function SeatFloorPlan({ facility, availableSeats, selected, onSelect, disabled }) {
  const [section, setSection] = useState(0);
  const free = useMemo(() => new Set(availableSeats), [availableSeats]);
  const style = planStyle(facility);
  const { landmark, podSize } = FLOORS[style];
  const sectionCount = Math.ceil(facility.capacity / SEATS_PER_SECTION);
  const first = section * SEATS_PER_SECTION + 1;
  const last = Math.min(first + SEATS_PER_SECTION - 1, facility.capacity);
  const pods = [];
  for (let start = first; start <= last; start += podSize) {
    pods.push(Array.from({ length: Math.min(podSize, last - start + 1) }, (_, index) => start + index));
  }

  return (
    <section className="seat-map" aria-labelledby="seat-map-title">
      <header className="seat-map-header">
        <div><h3 id="seat-map-title">Choose a seat</h3><p>Illustrative floor plan · {facility.name}</p></div>
        <strong role="status">{availableSeats.length} of {facility.capacity} free</strong>
      </header>
      <ul className="seat-key" aria-label="Seat map legend">
        <li><i className="free" />Available</li><li><i className="picked" />Selected</li><li><i className="taken" />Occupied</li>
      </ul>
      {sectionCount > 1 && (
        <label className="seat-section-picker">Map section
          <select value={section} onChange={(event) => setSection(Number(event.target.value))}>
            {Array.from({ length: sectionCount }, (_, index) => (
              <option key={index} value={index}>Seats {index * SEATS_PER_SECTION + 1}–{Math.min((index + 1) * SEATS_PER_SECTION, facility.capacity)}</option>
            ))}
          </select>
        </label>
      )}
      <fieldset className={`floor-shell floor-${style}`} disabled={disabled}>
        <legend className="floor-sr-only">Select an available seat in {facility.name}</legend>
        <div className="floor-front"><span>{landmark}</span></div>
        <div className="floor-pods">
          {pods.map((numbers) => (
            <div key={numbers[0]} className="floor-pod">
              {numbers.map((number) => {
                const available = free.has(number);
                return (
                  <label className="floor-seat" key={number}>
                    <input type="radio" name="seat_number" value={number} disabled={!available}
                      aria-label={`Seat ${number}, ${available ? "available" : "occupied"}`}
                      checked={selected === number} onChange={() => onSelect(number)} />
                    <span className={available ? "free" : "taken"}>{number}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
        <div className="floor-entry" aria-hidden="true"><i />Entrance</div>
      </fieldset>
    </section>
  );
}
