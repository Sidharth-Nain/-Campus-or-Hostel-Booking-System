export const bookingModes = {
  standard: "Single booking",
  teaching: "Whole room · teachers",
  study_room: "Study use only",
  study_seat: "Numbered seat · study pass",
};

export function facilityBookingMode(facility) {
  return facility.booking_mode || "standard";
}

export function canRequestFacility(role, facility) {
  const mode = facilityBookingMode(facility);
  if (role === "teacher") return mode === "teaching";
  return role === "student" && (mode === "standard" || mode === "study_room");
}
