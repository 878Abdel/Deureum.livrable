const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expirée");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Erreur API");
  }

  return response.json();
}