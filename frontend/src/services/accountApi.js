const BASE_URL = "http://127.0.0.1:5000/api/accounts";

// === FETCH ALL ACCOUNTS ===
export const fetchAccounts = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(BASE_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || "Failed to fetch accounts");

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Fetch accounts error:", err);
    return [];
  }
};

// === DELETE AN ACCOUNT ===
export const deleteAccount = async (accountId) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`${BASE_URL}/${accountId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to delete account");

    return { success: true };
  } catch (err) {
    console.error("❌ Delete account error:", err);
    return { success: false, error: err.message };
  }
};

// === SET DEFAULT ACCOUNT ===
export const setDefaultAccount = async (accountId) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${accountId}/set_default`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to set default account");
  return data;
};

// === GET DEFAULT ACCOUNT ===
export const getDefaultAccount = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/default`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Failed to get default account");
  return data;
};

// === FETCH TRANSACTIONS BY ACCOUNT ===
export async function getTransactionsByAccount(accountId) {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(`http://127.0.0.1:5000/api/transactions?accountId=${accountId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch transactions for account ${accountId}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Error fetching transactions by account:", err);
    return [];
  }
}
