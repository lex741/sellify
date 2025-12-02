const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function api(path, { method = "GET", body, token } = {}) {
    const res = await fetch(`${API}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
    return data;
}
