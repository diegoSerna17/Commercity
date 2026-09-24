const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api").replace(/\/+$/, "");

export async function apiRequest(path, options = {}) {
  const normalizedPath = path.replace(/^\/+/, "").replace(/^api\//, "");
  const headers = new Headers(options.headers || {});
  const requestOptions = { ...options, credentials: "include", headers };

  if (options.body !== undefined && !(options.body instanceof FormData) && typeof options.body !== "string") {
    headers.set("Content-Type", "application/json");
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}/${normalizedPath}`, requestOptions);
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof payload === "string"
      ? payload
      : payload?.error || payload?.message || "No fue posible completar la solicitud.";
    throw new Error(message);
  }

  return payload;
}
