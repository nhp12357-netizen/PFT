export async function fetchTransactions() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/transactions");
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch transactions:", err);
    return [];
  }
}
