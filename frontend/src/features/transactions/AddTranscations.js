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
    account_id: "",
    category_id: "",
  });

  //Fetch accounts, default account, and categories
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all accounts
        const accRes = await fetch("http://127.0.0.1:5000/api/accounts");
        const allAccounts = await accRes.json();

        // Fetch default account
        const defRes = await fetch("http://127.0.0.1:5000/api/accounts/default");
        const defaultAccount = defRes.ok ? await defRes.json() : null;

        let sortedAccounts = allAccounts;

        // Move default account to top if it exists
        if (defaultAccount) {
          sortedAccounts = [
            defaultAccount,
            ...allAccounts.filter((a) => a.id !== defaultAccount.id),
          ];
        }

        setAccounts(sortedAccounts);

        // Auto-select the default or first account
        setFormData((prev) => ({
          ...prev,
          account_id: defaultAccount
            ? defaultAccount.id
            : allAccounts[0]?.id || "",
        }));

        // Fetch categories
        const catRes = await fetch("http://127.0.0.1:5000/api/categories");
        const cats = await catRes.json();
        setCategories(cats);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    loadData();
  }, []);

  //Suggest category based on description
  useEffect(() => {
    if (formData.description.trim().length < 3) return;

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("http://127.0.0.1:5000/api/suggest-category", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: formData.description }),
        });

        const data = await res.json();
        if (data.suggested_category && data.category_id) {
          setSuggestedCategory(data.suggested_category);

          // Auto-select suggested category
          setFormData((prev) => ({
            ...prev,
            category_id: data.category_id,
          }));
        }
      } catch (err) {
        console.error("Suggestion error:", err);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.description]);

  //Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedCategory = categories.find(
      (cat) => cat.id === parseInt(formData.category_id)
    );
    const transactionType = selectedCategory?.type || "EXPENSE";

    const payload = {
      date: formData.date,
      description: formData.description,
      amount: parseFloat(formData.amount),
      transaction_type: transactionType.toUpperCase(),
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

        {/*Display suggested category */}
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

        {/*Account dropdown — default first, preselected */}
        <select
          name="account_id"
          value={formData.account_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Account</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} {acc.is_default ? "⭐" : ""}
            </option>
          ))}
        </select>

        {/* Category dropdown */}
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
