function photoKey(name, location) {
  return JSON.stringify([name.trim().toLowerCase(), location.trim().toLowerCase()]);
}

const catalogPhotos = new Map([
  ["Central Library Study Room", "Library, Level 1", "library-study"],
  ["Seminar Hall A", "Main Block, Floor 2", "seminar-hall"],
  ["Computer Lab 3", "Technology Block", "computer-lab"],
  ["Football Ground", "South Campus", "football-ground"],
  ["Innovation Studio", "Innovation Centre", "innovation-studio"],
  ["Basketball Court", "Sports Complex", "basketball-court"],
  ["AI Lab", "Technology Block, Floor 2", "ai-lab"],
  ["Robotics Lab", "Engineering Block, Ground floor", "robotics-lab"],
  ["Design Workshop", "Arts Centre, Floor 1", "design-workshop"],
  ["Badminton Court", "Indoor Sports Centre, Court 1", "badminton-court"],
  ["Table Tennis Room", "Indoor Sports Centre, Floor 1", "table-tennis-room"],
  ["Classroom North 101", "North Academic Block, Ground floor", "classroom-north-101"],
  ["Classroom North 204", "North Academic Block, Floor 2", "classroom-north-204"],
  ["Smart Classroom C12", "Learning Centre, Floor 1", "smart-classroom-c12"],
  ["Lecture Hall East", "East Academic Block, Ground floor", "lecture-hall-east"],
  ["Quiet Study Desks", "Library, Level 2", "quiet-study-desks"],
  ["Silent Reading Carrels", "Library, Level 3", "silent-reading-carrels"],
  ["Group Study Desk Bay", "Student Commons, Level 1", "group-study-desk-bay"],
  ["Coding Commons Desks", "Technology Block, Floor 1", "coding-commons-desks"],
  ["Research Workstations", "Learning Centre, Floor 2", "research-workstations"],
].map(([name, location, filename]) => [photoKey(name, location), filename]));

export function facilityImage({ name, location }) {
  const filename = catalogPhotos.get(photoKey(name, location));
  return filename ? `${import.meta.env?.BASE_URL ?? "/"}images/${filename}.jpg` : null;
}
