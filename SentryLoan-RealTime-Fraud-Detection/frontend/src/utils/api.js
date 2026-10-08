// utils/api.js
const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = true, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  myAccount: () => request("/accounts/mine"),
  lookupAccount: (accountId) => request(`/accounts/lookup/${encodeURIComponent(accountId)}`),

  // formData: a browser FormData instance (accountId, purpose, loanAmount, document?)
  submitLoanApplication: (formData) => request("/loan-applications", { method: "POST", body: formData, isFormData: true }),
  myApplications: () => request("/loan-applications/mine"),
  officerApplications: () => request("/loan-applications"),
  getApplication: (id) => request(`/loan-applications/${id}`),
  decideApplication: (id, payload) => request(`/loan-applications/${id}`, { method: "PATCH", body: payload }),

  // The document route requires the auth header, so a plain <a href> won't work -
  // fetch it as a blob and trigger the browser download ourselves.
  downloadDocument: async (id, filename) => {
    const token = getToken();
    const res = await fetch(`${BASE}/loan-applications/${id}/document`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Could not download document");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "document.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
};
