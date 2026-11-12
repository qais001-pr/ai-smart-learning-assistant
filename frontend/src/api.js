// Small fetch helper. Uses relative URLs (/api/...) so it works in Docker (nginx proxy) and in dev (vite proxy).
export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(t) {
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export async function api(url, data, { onExpired } = {}) {
  const token = getToken();
  const opts = { headers: { "Content-Type": "application/json" } };
  if (token) opts.headers.Authorization = token;
  if (data) {
    opts.method = "POST";
    opts.body = JSON.stringify(data);
  }
  const r = await fetch(url, opts);
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token) {
    onExpired?.();
    throw new Error("Session expired. Please log in again.");
  }
  if (!r.ok)
    throw new Error(
      typeof d.detail === "string" ? d.detail : "Please fill in all fields correctly"
    );
  return d;
}

export function logoutRequest() {
  const token = getToken();
  if (token)
    fetch("/api/auth/logout", { method: "POST", headers: { Authorization: token } }).catch(() => {});
}
