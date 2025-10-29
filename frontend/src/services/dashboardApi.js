export async function fetchDashboardData(token, monthYear) {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/dashboard?month=${monthYear}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || `Error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Dashboard fetch failed:", err);
    throw err;
  }
}
