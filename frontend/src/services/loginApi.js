// src/services/loginApi.js
export async function loginUser(username, password) {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw data.message || "Login failed";
    }

    // 🟢 Store the JWT token
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user_id", data.user_id);
      localStorage.setItem("username", data.username);
    }

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}
