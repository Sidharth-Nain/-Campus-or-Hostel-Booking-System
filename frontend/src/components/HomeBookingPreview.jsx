import { useState } from "react";

import { BRAND_LOGO_URL } from "../brand";
import { RouteLink } from "./AppLayout";
import FacilityPhoto from "./FacilityPhoto";
import "../home-booking-preview.css";

const STUDY_ROOM = {
  name: "Quiet Study Desks",
  location: "Library, Level 2",
  capacity: 24,
  amenities: ["Power outlets", "Wi-Fi", "Desk lamps"],
};

const SAMPLE_SEATS = Array.from({ length: 8 }, (_, index) => String(index + 1).padStart(2, "0"));
const TAKEN_SEATS = { "02": "Sam", "05": "Sahil" };
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const SLOTS = ["10:00–11:00 a.m.", "11:00 a.m.–noon", "1:00–2:00 p.m."];

const TEACHING_ROOMS = [
  {
    shortName: "North 101",
    name: "Classroom North 101",
    location: "North Academic Block, Ground floor",
    capacity: 32,
    amenities: ["Projector", "Whiteboard", "Wi-Fi"],
    bookedSlot: 0,
    event: "Revision workshop",
  },
  {
    shortName: "North 204",
    name: "Classroom North 204",
    location: "North Academic Block, Floor 2",
    capacity: 36,
    amenities: ["Movable desks", "Whiteboard", "Wi-Fi"],
    bookedSlot: 1,
    event: "Group tutorial",
  },
  {
    shortName: "East Hall",
    name: "Lecture Hall East",
    location: "East Academic Block, Ground floor",
    capacity: 140,
    amenities: ["Projector", "Microphones", "Step-free access"],
    bookedSlot: 2,
    event: "Guest lecture",
  },
];

function FloorPlan({ isSeat, selection, onSelect }) {
  return (
    <div className="booking-demo-panel booking-demo-map">
      <div className="booking-demo-bar">
        <span>Floor plan</span>
        <span>{isSeat ? "Library · Level 2" : "Teaching spaces"}</span>
      </div>
      <div className="booking-demo-plan">
        <div className="booking-demo-plan-label">
          <span>{isSeat ? "Quiet Study Desks" : "Select a room"}</span>
          {isSeat && <span className="booking-demo-plan-secondary">8 of 24 seats illustrated</span>}
        </div>
        {isSeat ? (
          <div className="booking-demo-desks" role="group" aria-label="Numbered sample desks">
            {SAMPLE_SEATS.map((seat) => (
              <button type="button" key={seat} disabled={Boolean(TAKEN_SEATS[seat])}
                aria-pressed={selection === seat} onClick={() => onSelect(seat)}
                aria-label={`Desk ${seat}${TAKEN_SEATS[seat] ? `, reserved by ${TAKEN_SEATS[seat]}` : ""}`}>
                <span>{seat}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="booking-demo-rooms" role="group" aria-label="Sample teaching rooms">
            {TEACHING_ROOMS.map((room, index) => (
              <button type="button" key={room.name} aria-pressed={selection === index}
                onClick={() => onSelect(index)}>
                <span>{room.shortName}</span><small>{room.capacity} seats</small>
              </button>
            ))}
          </div>
        )}
        <div className="booking-demo-walkway" aria-hidden="true">Main aisle</div>
      </div>
      <div className="booking-demo-legend">
        <span>Outlined: available</span><span>Violet: selected</span>{isSeat && <span>Gray: reserved</span>}
      </div>
    </div>
  );
}

function PreviewSchedule({ isSeat, desk, room, slot, onSlot, previewed }) {
  return (
    <div className="booking-demo-panel booking-demo-schedule">
      <div className="booking-demo-bar"><span>Sample schedule</span></div>
      <div className="booking-demo-schedule-body">
        {isSeat ? (
          <>
            <div className="booking-demo-week" role="group" aria-label="A seven-day pass from Monday through Sunday">
              {DAYS.map((day) => <span aria-hidden="true" key={day}>{day}</span>)}
            </div>
            <ul className="booking-demo-schedule-list">
              {Object.entries(TAKEN_SEATS).map(([seat, person]) => (
                <li key={seat}><strong>Desk {seat}</strong><span>{person} · Reserved</span></li>
              ))}
              <li className="booking-demo-next"><strong>Desk {desk}</strong><span>{previewed ? "Your sample pass" : "Your selection"}</span></li>
            </ul>
          </>
        ) : (
          <div className="booking-demo-slots" role="group" aria-label="Sample time slots">
            {SLOTS.map((time, index) => (
              <button type="button" key={time} disabled={index === room.bookedSlot}
                aria-pressed={index === slot} onClick={() => onSlot(index)}>
                <strong>{time}</strong><span>{index === room.bookedSlot ? `${room.event} · Booked` : index === slot ? "Selected" : "Available"}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingSample({ isSeat }) {
  const [desk, setDesk] = useState("07");
  const [roomIndex, setRoomIndex] = useState(0);
  const [slot, setSlot] = useState(1);
  const [previewed, setPreviewed] = useState(false);
  const room = isSeat ? STUDY_ROOM : TEACHING_ROOMS[roomIndex];
  const selection = isSeat ? `Desk ${desk}` : SLOTS[slot];

  function changeMapSelection(nextSelection) {
    if (isSeat) setDesk(nextSelection);
    else {
      setRoomIndex(nextSelection);
      setSlot(SLOTS.findIndex((_, index) => index !== TEACHING_ROOMS[nextSelection].bookedSlot));
    }
    setPreviewed(false);
  }

  return (
    <div className="booking-demo-workbench">
      <div className="booking-demo-titlebar">
        <img src={BRAND_LOGO_URL} width="27" height="27" alt="" />
        <span>Campus Flow booking preview</span><strong>Demo only</strong>
      </div>
      <div className="booking-demo-stage">
        <FloorPlan isSeat={isSeat} selection={isSeat ? desk : roomIndex} onSelect={changeMapSelection} />
        <PreviewSchedule isSeat={isSeat} desk={desk} room={room} slot={slot} previewed={previewed}
          onSlot={(index) => { setSlot(index); setPreviewed(false); }} />
        <div className="booking-demo-panel booking-demo-details">
          <div className="booking-demo-bar"><span>Space details</span></div>
          <div className="booking-demo-photo"><FacilityPhoto facility={room} lazy /></div>
          <div className="booking-demo-detail-body">
            <h3>{room.name}</h3>
            <p>{room.location} · {room.capacity} seats</p>
            <ul className="booking-demo-amenities" aria-label="Sample amenities">
              {room.amenities.map((amenity) => <li key={amenity}>{amenity}</li>)}
            </ul>
            <p className="booking-demo-price"><strong>{selection}</strong><span>{isSeat ? "Focus Week · ₹99 / 7 days" : "Whole room · Admin approval"}</span></p>
            <button type="button" className="button primary" onClick={() => setPreviewed(true)} disabled={previewed}>
              {isSeat ? "Preview a reservation" : "Preview a request"}
            </button>
            <div className="booking-demo-receipt" role="status">
              {previewed && (isSeat ? "Sample reservation confirmed. No seat was reserved or charged." : "Sample request ready for approval. Nothing was submitted.")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomeBookingPreview() {
  const [isSeat, setIsSeat] = useState(true);

  return (
    <section className="landing-section booking-demo" id="booking-preview" aria-labelledby="booking-demo-title">
      <div className="landing-section-heading">
        <p className="eyebrow">Interactive booking preview</p>
        <h2 id="booking-demo-title">Try a booking before you sign in</h2>
        <p className="muted">Pick a library desk or a whole teaching room. This example uses a sample schedule, not live availability.</p>
      </div>
      <div className="audience-switch" role="group" aria-label="Booking preview type">
        <button type="button" aria-pressed={isSeat} onClick={() => setIsSeat(true)}>Study seat</button>
        <button type="button" aria-pressed={!isSeat} onClick={() => setIsSeat(false)}>Teaching room</button>
      </div>
      <BookingSample key={isSeat ? "seat" : "room"} isSeat={isSeat} />
      <div className="booking-demo-footer">
        <p className="muted">The preview cannot book a space or collect payment.</p>
        <RouteLink className="button outline" to={isSeat ? "/plans" : "/teaching"}>
          {isSeat ? "Explore seat passes" : "Browse real teaching rooms"}
        </RouteLink>
      </div>
    </section>
  );
}
