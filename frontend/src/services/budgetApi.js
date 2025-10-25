const API = "http://127.0.0.1:5000/api/budgets";


export async function fetchBudgets(month) {
  const res = await fetch(`${API}?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch budgets");
  return await res.json();  // should be an array of budgets with spent field
}



export async function saveBudgets(data) {
  const res = await fetch(`${API}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save budgets");
  return res.json();
}

export async function fetchRecommendedBudgets(month) {
  // Optional: implement backend recommendations route
  const res = await fetch(`${API}/recommendations?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json(); // { category_id: limit_amount }
}
