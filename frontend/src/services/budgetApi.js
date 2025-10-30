const BASE_URL = "http://127.0.0.1:5000/api/budgets";

// === FETCH ALL BUDGETS FOR A MONTH ===
export async function fetchBudgets(month) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${BASE_URL}?month=${month}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || "Failed to fetch budgets");

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Fetch budgets error:", err);
    throw err;
  }
}

// === SAVE / UPDATE BUDGETS ===
export async function saveBudgets(budgets) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${BASE_URL}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(budgets),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to save budgets");

    return data;
  } catch (err) {
    console.error("❌ Save budgets error:", err);
    throw err;
  }
}

// === FETCH RECOMMENDED BUDGETS ===
export async function fetchRecommendedBudgets(month) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${BASE_URL}/recommendations?month=${month}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to fetch recommendations");

    return data; // { category_id: limit_amount }
  } catch (err) {
    console.error("❌ Fetch recommended budgets error:", err);
    throw err;
  }
}
