import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";

function AddTransaction({ onTransactionAdded }) {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount: "",
    type: "expense",
    account_id: "",
    category_id: "",
  });

  // Fetch accounts and categories
  useEffect(() => {
    fetch("http://localhost:5000/api/accounts")
      .then((res) => res.json())
      .then(setAccounts)
      .catch((err) => console.error("Failed to load accounts:", err));

    fetch("http://localhost:5000/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(""); // clear error when user types
  };

  const validateForm = () => {
    // 1️⃣ Date validation
    if (!formData.date) {
      setError("Please select a valid date.");
      return false;
    }

    // 2️⃣ Amount validation
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number.");
      return false;
    }

    // 3️⃣ Check required fields
    if (!formData.account_id || !formData.category_id) {
      setError("Please select both account and category.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_type: formData.type.toUpperCase(),
      account_id: parseInt(formData.account_id),
      category_id: parseInt(formData.category_id),
    };

    try {
      const res = await fetch("http://localhost:5000/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("✅ Transaction added successfully!");
        if (onTransactionAdded) {
          onTransactionAdded(); // refresh list in parent
        } else {
          navigate("/transactions");
        }
      } else {
        const data = await res.json();
        alert("❌ Error: " + (data.error || "Failed to add transaction"));
      }
    } catch (err) {
      alert("❌ Failed to add transaction");
      console.error(err);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Add Transaction</h2>
      {error && <p className={styles.errorMsg}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
          min="0.01"
          step="0.01"
        />

        <select name="type" value={formData.type} onChange={handleChange}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        <select
          name="account_id"
          value={formData.account_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className={styles.formButtons}>
          <button type="submit">Add Transaction</button>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddTransaction;
