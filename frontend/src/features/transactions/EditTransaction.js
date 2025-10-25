import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState({
    date: "",
    description: "",
    amount: "",
    transaction_type: "EXPENSE",
    account_id: "",
    category_id: "",
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // Fetch Transaction, Accounts, and Categories
  // ===============================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1️⃣ Fetch transaction details by ID
        const txnRes = await fetch(`http://127.0.0.1:5000/api/transactions/${id}`);
        if (!txnRes.ok) throw new Error("Failed to load transaction");
        const txnData = await txnRes.json();
        setTransaction(txnData);

        // 2️⃣ Fetch accounts and categories
        const [accRes, catRes] = await Promise.all([
          fetch("http://127.0.0.1:5000/api/accounts"),
          fetch("http://127.0.0.1:5000/api/categories"),
        ]);

        const accData = await accRes.json();
        const catData = await catRes.json();

        setAccounts(accData);
        setCategories(catData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // ===============================
  // Handle Input Change
  // ===============================
  const handleChange = (e) => {
    setTransaction({
      ...transaction,
      [e.target.name]: e.target.value,
    });
  };

  // ===============================
  // Handle Form Submit
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      alert("✅ Transaction updated successfully!");
      navigate("/transactions");
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  // ===============================
  // Loading & Error States
  // ===============================
  if (loading) return <p>Loading transaction...</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

  // ===============================
  // Render Form
  // ===============================
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Edit Transaction</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Date */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Date:</label>
          <input
            type="date"
            name="date"
            value={transaction.date}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Description */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Description:</label>
          <input
            type="text"
            name="description"
            value={transaction.description}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Amount */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Amount:</label>
          <input
            type="number"
            name="amount"
            value={transaction.amount}
            onChange={handleChange}
            required
            style={styles.input}
          />
        </div>

        {/* Transaction Type */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Transaction Type:</label>
          <select
            name="transaction_type"
            value={transaction.transaction_type}
            onChange={handleChange}
            style={styles.select}
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
        </div>

        {/* Account */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Account:</label>
          <select
            name="account_id"
            value={transaction.account_id}
            onChange={handleChange}
            style={styles.select}
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Category:</label>
          <select
            name="category_id"
            value={transaction.category_id}
            onChange={handleChange}
            style={styles.select}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div style={styles.buttonContainer}>
          <button type="submit" style={styles.saveButton}>
            💾 Save Changes
          </button>
          <button
            type="button"
            onClick={() => navigate("/transactions")}
            style={styles.cancelButton}
          >
            ❌ Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ===============================
// Inline Styles
// ===============================
const styles = {
  container: {
    padding: "20px",
    maxWidth: "500px",
    margin: "auto",
    background: "#f9f9f9",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  heading: {
    textAlign: "center",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  formGroup: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  select: {
    width: "100%",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  saveButton: {
    background: "green",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  cancelButton: {
    background: "gray",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default EditTransaction;
