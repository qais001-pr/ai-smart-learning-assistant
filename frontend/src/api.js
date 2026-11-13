// All calls to the FastAPI backend go through this one function.
let token = localStorage.getItem("token");
let onExpired = () => {};

export const hasToken = () => !!token;
export const setExpiredHandler = (f) => (onExpired = f);
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

export async function api(url, data) {
  const o = { headers: { "Content-Type": "application/json" } };
  if (token) o.headers.Authorization = token;
  if (data) { o.method = "POST"; o.body = JSON.stringify(data); }
  const r = await fetch(url, o);
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && token) { onExpired(); throw new Error("Session expired. Please log in again."); }
  if (!r.ok) throw new Error(typeof d.detail === "string" ? d.detail : "Please fill in all fields correctly");
  return d;
}
