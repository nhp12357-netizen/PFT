


// === Fetch all budgets for the current month ===
export async function fetchBudgets() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/budgets");
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch budgets:", err);
    return [];
  }
}

// === Set or update a budget ===
export async function setBudget(budgetId, categoryId, limitAmount, month) {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/budgets/set`, {
      method: "POST", // or "PUT" if you want to update
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: budgetId,        // optional: only for update
        category_id: categoryId,
        limit_amount: limitAmount,
        month: month,        // e.g., "10" for October
      }),
    });
    if (!res.ok) throw new Error(`Failed to set budget: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error setting budget:", err);
    return { success: false, error: err.message };
  }
}

// === Delete a budget by ID ===
export async function deleteBudget(budgetId) {
  try {
    const res = await fetch(`http://127.0.0.1:5000/api/budgets/${budgetId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error(`Failed to delete budget: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error deleting budget:", err);
    return { success: false, error: err.message };
  }
}

export const saveBudgets = async (budgetData) => {
  const response = await fetch("http://127.0.0.1:5000/api/budgets/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(budgetData),
  });

  if (!response.ok) {
    throw new Error("Failed to save budget");
  }

  return await response.json();
};


export async function fetchRecommendedBudgets() {
  const res = await fetch(`http://127.0.0.1:5000/api/budgets/recommendations`);
  if (!res.ok) throw new Error("Error fetching recommendations");
  return res.json(); // { categoryId: amount }
}