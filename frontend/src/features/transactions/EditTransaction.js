import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditTransaction() {
  const { id } = useParams(); // transaction ID from URL
  const navigate = useNavigate();

  const [form, setForm] = useState({
    date: "",
    description: "",
    amount: "",
    account_id: "",
    category_id: "",
    transaction_type: "EXPENSE",
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // === Fetch transaction details, accounts, categories ===
  useEffect(() => {
    fetchTransaction();
    fetchAccounts();
    fetchCategories();
  }, []);

  const fetchTransaction = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/transactions?id=${id}`);
      const data = await res.json();
      const tx = data.find((item) => item.id === Number(id)); 

      if (tx) {
        setForm({
          date: tx.date,
          description: tx.description,
          amount: tx.amount,
          account_id: tx.account_id,
          category_id: tx.category_id,
          transaction_type: tx.transaction_type,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch transaction:", err);
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/accounts");
    setAccounts(await res.json());
  };

  const fetchCategories = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/categories");
    setCategories(await res.json());
  };

  // === Handle Input Change ===
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // === Submit Edited Data ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update");

      alert("Transaction updated!");
      navigate("/transactions"); // Redirect back
    } catch (err) {
      console.error(err);
      alert("Update failed!");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "auto" }}>
      <h2>Edit Transaction</h2>
      <form onSubmit={handleSubmit}>
        <label>Date:</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} required />

        <label>Description:</label>
        <input type="text" name="description" value={form.description} onChange={handleChange} required />

        <label>Amount:</label>
        <input type="number" name="amount" value={form.amount} onChange={handleChange} required />

        <label>Transaction Type:</label>
        <select name="transaction_type" value={form.transaction_type} onChange={handleChange}>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>

        <label>Account:</label>
        <select name="account_id" value={form.account_id} onChange={handleChange} required>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <label>Category:</label>
        <select name="category_id" value={form.category_id} onChange={handleChange} required>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button type="submit" style={{ marginTop: "10px" }}>Save Changes</button>
        <button type="button" onClick={() => navigate("/transactions")} style={{ marginLeft: "10px" }}>Cancel</button>
      </form>
    </div>
  );
}

export default EditTransaction;
