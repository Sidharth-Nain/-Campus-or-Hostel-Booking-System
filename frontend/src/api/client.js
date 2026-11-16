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
    throw new Error("CampusFlow API is not reachable. Make sure the FastAPI terminal is running.");
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

function adminHeaders(token) {
  return { Authorization: `Bearer ${token}` };
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
