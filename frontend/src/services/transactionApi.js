const BASE_URL = "http://127.0.0.1:5000/api/transactions";

// === FETCH ALL TRANSACTIONS ===
export const fetchTransactions = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(BASE_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || "Failed to fetch transactions");

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Fetch transactions error:", err);
    return [];
  }
};

// === ADD TRANSACTION ===
export const addTransaction = async (transaction) => {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(transaction),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to add transaction");
  return data;
};

// === DELETE TRANSACTION ===
export const deleteTransaction = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to delete transaction");
  return data;
};

// === GET TRANSACTIONS BY ACCOUNT ===
export const getTransactionsByAccount = async (accountId) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${BASE_URL}?accountId=${accountId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || "Failed to fetch transactions");

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Error fetching transactions by account:", err);
    return [];
  }
};

// === UPDATE TRANSACTION ===
export async function updateTransaction(id, updatedData) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/transactions/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update transaction");
    }

    return data; // return updated transaction
  } catch (err) {
    console.error("Error updating transaction:", err);
    throw err;
  }
}
