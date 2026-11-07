const facilities = [
  { id: 1, name: "Central Library Study Room", type: "Study", icon: "▤", tone: "", location: "Library, Level 1", capacity: 8, description: "A quiet collaborative study room with a display and whiteboard." },
  { id: 2, name: "Seminar Hall A", type: "Academic", icon: "◫", tone: "gold", location: "Main Block, Floor 2", capacity: 80, description: "A presentation-ready space for talks, workshops, and society events." },
  { id: 3, name: "Computer Lab 3", type: "Academic", icon: "⌘", tone: "", location: "Technology Block", capacity: 40, description: "A supervised lab with workstations for technical sessions." },
  { id: 4, name: "Football Ground", type: "Sports", icon: "◌", tone: "green", location: "South Campus", capacity: 120, description: "An outdoor field for team practice and inter-college events." },
  { id: 5, name: "Innovation Studio", type: "Study", icon: "✦", tone: "", location: "Innovation Centre", capacity: 20, description: "A flexible project room for maker sessions and teamwork." },
  { id: 6, name: "Basketball Court", type: "Sports", icon: "◇", tone: "green", location: "Sports Complex", capacity: 30, description: "Indoor court for training and recreational games." }
];

let selectedFacility = facilities[1];
let requests = [
  { id: 1, requester: "Meera Iyer", facility: "Seminar Hall A", time: "10 Nov · 10:00–12:00", purpose: "Design club workshop", status: "Pending" },
  { id: 2, requester: "Kabir Singh", facility: "Football Ground", time: "10 Nov · 15:00–17:00", purpose: "Practice match", status: "Pending" },
  { id: 3, requester: "Aarav Sharma", facility: "Central Library Study Room", time: "11 Nov · 09:00–10:00", purpose: "Project meeting", status: "Approved" }
];

const screens = document.querySelectorAll("[data-screen]");
function route() {
  const id = location.hash.slice(1) || "student-dashboard";
  const screen = document.getElementById(id) || document.getElementById("student-dashboard");
  screens.forEach((item) => { item.hidden = item !== screen; });
  window.scrollTo({ top: 0, behavior: "instant" });
}
window.addEventListener("hashchange", route);

function renderFacilities() {
  const query = document.querySelector("#facility-search").value.toLowerCase();
  const type = document.querySelector("#type-filter").value;
  const cards = facilities.filter((facility) => (type === "all" || facility.type === type) && `${facility.name} ${facility.location}`.toLowerCase().includes(query));
  document.querySelector("#facility-list").innerHTML = cards.length ? cards.map((f) => `
    <article class="facility-card card"><div class="facility-visual ${f.tone}">${f.icon}</div><div><p class="eyebrow">${f.type}</p><h2>${f.name}</h2><p class="muted">${f.location}</p><div class="facility-meta"><span>${f.capacity} people</span><span class="availability-badge">● Available</span></div><button class="button secondary" type="button" data-book-facility="${f.id}">View & book</button></div></article>`).join("") : '<p class="empty">No facilities match these filters.</p>';
}
function setBookingFacility(id) {
  selectedFacility = facilities.find((facility) => facility.id === Number(id)) || facilities[0];
  document.querySelector("#booking-name").textContent = selectedFacility.name;
  document.querySelector("#booking-type").textContent = selectedFacility.type.toUpperCase();
  document.querySelector("#booking-description").textContent = selectedFacility.description;
  document.querySelector("#booking-location").textContent = selectedFacility.location;
  document.querySelector("#booking-capacity").textContent = `${selectedFacility.capacity} people`;
  document.querySelector("#booking-icon").textContent = selectedFacility.icon;
}
function renderBookings() {
  const personal = requests.filter((item) => item.requester === "Aarav Sharma");
  document.querySelector("#student-bookings").innerHTML = personal.length ? personal.map((item) => `<tr><td>${item.facility}</td><td>${item.time}</td><td>${item.purpose}</td><td><span class="pill ${item.status.toLowerCase()}">${item.status}</span></td><td>${item.status === "Pending" ? '<button class="small-button reject" type="button">Cancel</button>' : ""}</td></tr>`).join("") : '<tr><td class="empty" colspan="5">You have no booking requests yet.</td></tr>';
  const pending = requests.filter((item) => item.status === "Pending");
  document.querySelector("#pending-count").textContent = pending.length;
  document.querySelector("#admin-requests").innerHTML = pending.map((item) => `<tr><td>${item.requester}<br><small>${item.purpose}</small></td><td>${item.facility}</td><td>${item.time}</td><td><div class="action-row"><button class="small-button" data-action="approve" data-id="${item.id}">Approve</button><button class="small-button reject" data-action="reject" data-id="${item.id}">Reject</button></div></td></tr>`).join("") || '<tr><td class="empty" colspan="4">No requests awaiting review.</td></tr>';
}
function renderAdminFacilities() { document.querySelector("#admin-facilities").innerHTML = facilities.slice(0, 4).map((f) => `<li><span><strong>${f.name}</strong><br><small>${f.location} · ${f.capacity} people</small></span><span class="availability-badge">Active</span></li>`).join(""); }

document.addEventListener("click", (event) => {
  const bookingButton = event.target.closest("[data-book-facility]");
  if (bookingButton) { setBookingFacility(bookingButton.dataset.bookFacility); location.hash = "booking"; }
  const action = event.target.closest("[data-action]");
  if (action) { const request = requests.find((item) => item.id === Number(action.dataset.id)); request.status = action.dataset.action === "approve" ? "Approved" : "Rejected"; renderBookings(); }
});
document.querySelector("#facility-search").addEventListener("input", renderFacilities);
document.querySelector("#type-filter").addEventListener("change", renderFacilities);
document.querySelectorAll("[data-auth-tab]").forEach((tab) => tab.addEventListener("click", () => { const signup = tab.dataset.authTab === "signup"; document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.toggle("active", item === tab)); document.querySelectorAll(".signup-only").forEach((item) => item.hidden = !signup); document.querySelector("#auth-form .primary").textContent = signup ? "Create student account" : "Continue"; }));
document.querySelector("#auth-form").addEventListener("submit", (event) => { event.preventDefault(); document.querySelector("#auth-message").textContent = "Prototype only: authentication will be connected during Day 3."; });
document.querySelector("#booking-form").addEventListener("submit", (event) => { event.preventDefault(); const data = new FormData(event.currentTarget); requests.push({ id: Date.now(), requester: "Aarav Sharma", facility: selectedFacility.name, time: `${data.get("date")} · ${data.get("start")}–${data.get("end")}`, purpose: data.get("purpose"), status: "Pending" }); document.querySelector("#booking-message").textContent = "Booking request added to this prototype’s local view."; renderBookings(); });
document.querySelector("#add-facility").addEventListener("click", () => { alert("Facility management is a Day 3 backend feature. This interface is a Day 2 design preview."); });
renderFacilities(); renderBookings(); renderAdminFacilities(); route();
