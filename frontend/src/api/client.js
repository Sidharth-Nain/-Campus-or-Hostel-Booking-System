import { BRAND_NAME } from "../brand";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

function readableError(detail) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || "Please check the submitted information.").join(" ");
  }
  return "Something went wrong. Please try again.";
}

async function apiRequest(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(`${BRAND_NAME} could not reach the booking server. Try again in a moment.`);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(readableError(data?.detail));
  }
  return data;
}

export function registerUser(payload) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function loginUser(payload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentUser(token) {
  return apiRequest("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getFacilities() {
  return apiRequest("/facilities");
}

export function getFacility(facilityId) {
  return apiRequest(`/facilities/${facilityId}`);
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

export function getSeatPlans() {
  return apiRequest("/seat-passes/plans");
}

export function getSeatAvailability(token, selection) {
  const query = new URLSearchParams(selection);
  return apiRequest(`/seat-passes/availability?${query}`, { headers: authHeaders(token) });
}

export function reserveSeatPass(token, payload) {
  return apiRequest("/seat-passes", {
    method: "POST", headers: authHeaders(token), body: JSON.stringify(payload),
  });
}

export function getMySeatPasses(token) {
  return apiRequest("/seat-passes", { headers: authHeaders(token) });
}

export function cancelSeatPass(token, id) {
  return apiRequest(`/seat-passes/${id}/cancel`, { method: "PATCH", headers: authHeaders(token) });
}

export function checkBookingAvailability(token, payload) {
  return apiRequest("/bookings/check-availability", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function createBooking(token, payload) {
  return apiRequest("/bookings", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function getMyBookings(token) {
  return apiRequest("/bookings", { headers: authHeaders(token) });
}

export function cancelBooking(token, bookingId) {
  return apiRequest(`/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function getAdminBookings(token, status = "pending") {
  return apiRequest(`/admin/bookings?status=${encodeURIComponent(status)}`, {
    headers: authHeaders(token),
  });
}

export function approveBooking(token, bookingId) {
  return apiRequest(`/admin/bookings/${bookingId}/approve`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

export function rejectBooking(token, bookingId) {
  return apiRequest(`/admin/bookings/${bookingId}/reject`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}

function adminHeaders(token) {
  return authHeaders(token);
}

export function getAdminFacilities(token) {
  return apiRequest("/admin/facilities", { headers: adminHeaders(token) });
}

export function createFacility(token, payload) {
  return apiRequest("/admin/facilities", {
    method: "POST",
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateFacility(token, facilityId, payload) {
  return apiRequest(`/admin/facilities/${facilityId}`, {
    method: "PATCH",
    headers: adminHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deactivateFacility(token, facilityId) {
  return apiRequest(`/admin/facilities/${facilityId}`, {
    method: "DELETE",
    headers: adminHeaders(token),
  });
}

export { API_BASE_URL };
