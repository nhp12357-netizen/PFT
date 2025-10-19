export async function fetchDashboardData() {
  try {
    const res = await fetch("http://localhost:5000/api/dashboard");
    if (!res.ok) throw new Error("Network response was not ok");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
