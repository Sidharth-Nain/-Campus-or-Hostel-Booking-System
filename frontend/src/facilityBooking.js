export const bookingModes = {
  standard: "Whole-space request",
  teaching: "Teacher whole-room request",
  study_room: "Study use only",
  study_seat: "Numbered seat · study pass",
};

export function facilityBookingMode(facility) {
  return facility.booking_mode || "standard";
}

export function facilityBookingLabel(facility) {
  if (!facility.seat_layout) return bookingModes[facilityBookingMode(facility)];
  if (facilityBookingMode(facility) === "teaching") return "Student seats · teacher whole-room requests";
  if (facilityBookingMode(facility) === "study_seat") return "Hourly seats · study passes";
  return "Instant seat booking";
}

export function usesSeatMap(role, facility) {
  return role === "student" && Boolean(facility.seat_layout);
}

export function canRequestFacility(role, facility) {
  const mode = facilityBookingMode(facility);
  if (role === "teacher") return mode === "teaching";
  return role === "student" && (usesSeatMap(role, facility) || mode === "standard");
}
