export async function fetchDashboardData() {
  try {
    const response = await fetch("http://localhost:5000/api/dashboard");
    if (!response.ok) throw new Error("Network response not ok");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return null;
  }
}



