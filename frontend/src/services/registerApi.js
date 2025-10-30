const API_BASE_URL = "http://127.0.0.1:5000";

export async function registerUser(data) {
  const response = await fetch(`${API_BASE_URL}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to register user");
  }

  return response.json();
}
