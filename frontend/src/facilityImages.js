const imageRules = [
  ["library", "/images/library-study.jpg"],
  ["seminar", "/images/seminar-hall.jpg"],
  ["computer", "/images/computer-lab.jpg"],
  ["football", "/images/football-ground.jpg"],
  ["basketball", "/images/basketball-court.jpg"],
  ["innovation", "/images/innovation-studio.jpg"],
];

export function facilityImage(name = "") {
  const normalizedName = name.toLowerCase();
  return imageRules.find(([keyword]) => normalizedName.includes(keyword))?.[1] || "/images/innovation-studio.jpg";
}
