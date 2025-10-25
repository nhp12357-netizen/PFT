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


export const deleteTransaction = async (id) => {
  if (!window.confirm("Are you sure you want to delete this transaction?")) return false;

  try {
    const res = await fetch(`http://localhost:5000/api/transactions/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      alert("Failed to delete: " + (data.error || "Unknown error"));
      return false;
    }

    alert("Transaction deleted successfully!");
    return true;
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
    return false;
  }
};