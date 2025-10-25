import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";

function AddTransaction({ onTransactionAdded }) {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suggestedCategory, setSuggestedCategory] = useState(null);

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
    fetch("http://127.0.0.1:5000/api/accounts")
      .then((res) => res.json())
      .then(setAccounts)
      .catch((err) => console.error("Failed to load accounts:", err));

    fetch("http://127.0.0.1:5000/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  // Suggest category based on description
  useEffect(() => {
    if (formData.description.trim().length < 3) return; // minimal length

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          "http://127.0.0.1:5000/api/suggest-category",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: formData.description }),
          }
        );

        const data = await res.json();
        if (data.suggested_category && data.category_id) {
          setSuggestedCategory(data.suggested_category);

          // Automatically select the category in the dropdown
          setFormData((prev) => ({
            ...prev,
            category_id: data.category_id,
          }));
        }
      } catch (err) {
        console.error("Suggestion error:", err);
      }
    }, 500); // debounce typing

    return () => clearTimeout(timeout);
  }, [formData.description]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_type: formData.type.toUpperCase(),
      account_id: parseInt(formData.account_id),
      category_id: parseInt(formData.category_id),
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Transaction added successfully!");
        if (onTransactionAdded) onTransactionAdded();
        else navigate("/transactions");
      } else {
        const data = await res.json();
        alert("Error: " + (data.error || "Failed to add transaction"));
      }
    } catch (err) {
      alert("Failed to add transaction");
      console.error(err);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h2>Add Transaction</h2>
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

        {/* Display suggested category */}
        {suggestedCategory && (
          <p className={styles.suggestionText}>
            💡 Suggested Category: <strong>{suggestedCategory}</strong>
          </p>
        )}

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
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
          value={formData.category_id || ""}
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

        <button type="submit">Add Transaction</button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => navigate(-1)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default AddTransaction;
