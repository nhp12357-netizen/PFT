export async function fetchAccounts() {
  try {
    const res = await fetch("http://127.0.0.1:5000/api/accounts");
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch accounts:", err);
    return [];
  }
}
