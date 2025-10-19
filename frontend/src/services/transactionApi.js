const API_BASE_URL = "http://127.0.0.1:5000"; // ✅ Use this consistently

export async function fetchTransactions() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`);
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    return [];
  }
}

export const addTransaction = async (transaction) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    return await res.json();
  } catch (err) {
    console.error("Failed to add transaction:", err);
    return null;
  }
};

export const fetchCategories = async () => {
  const res = await fetch(`${API_BASE_URL}/api/categories`);
  return await res.json();
};

export const fetchAccounts = async () => {
  const res = await fetch(`${API_BASE_URL}/api/accounts`);
  return await res.json();
};