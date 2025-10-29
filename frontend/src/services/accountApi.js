const API_BASE = "http://127.0.0.1:5000/api/accounts";


// === Fetch all accounts ===
export async function fetchAccounts() {
  try {
    const res = await fetch(`${API_BASE}/accounts`);
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch accounts:", err);
    return [];
  }
}

// === Delete an account ===

export async function deleteAccount(accountId) {
  try {
    const res = await fetch(`${API_BASE}/accounts/${accountId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to delete");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function getTransactionsByAccount(accountId) {
  try {
    const res = await fetch(`${API_BASE}/transactions?accountId=${accountId}`);
    if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching transactions:", err);
    return [];
  }
}




// ✅ Set an account as default
export async function setDefaultAccount(accountId) {
  const res = await fetch(`${API_BASE}/${accountId}/set_default`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to set default account");
  return res.json();
}

// ✅ Get the default account
export async function getDefaultAccount() {
  const res = await fetch(`${API_BASE}/default`);
  if (!res.ok) throw new Error("Failed to get default account");
  return res.json();
}

