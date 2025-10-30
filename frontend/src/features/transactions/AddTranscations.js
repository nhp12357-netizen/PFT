import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories } from "../../services/categoriesApi";
import { fetchAccounts } from "../../services/accountApi";
import { addTransaction } from "../../services/transactionApi";

export default function AddTransactions() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount: "",
    account_id: "",
    category_id: "",
    transaction_type: "EXPENSE",
    target_account_id: "",
  });

  useEffect(() => {
    loadDropdowns();
  }, []);

  const loadDropdowns = async () => {
    const [acc, cat] = await Promise.all([fetchAccounts(), fetchCategories()]);
    setAccounts(acc);
    setCategories(cat);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-set transaction type when category selected
    if (name === "category_id") {
      const selectedCat = categories.find((cat) => cat.id == value);
      if (selectedCat) {
        setFormData((prev) => ({
          ...prev,
          transaction_type: selectedCat.type,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.account_id || !formData.category_id || !formData.amount)
      return alert("All required fields must be filled.");

    try {
      const success = await addTransaction(formData);
      if (success) {
        alert("Transaction added successfully!");
        navigate("/transactions");
      }
    } catch (err) {
      alert("Failed to add transaction: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
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
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />

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
              {cat.name} ({cat.type})
            </option>
          ))}
        </select>

        <button type="submit">Add Transaction</button>
        <button type="button" onClick={() => navigate("/transactions")}>
          Cancel
        </button>
      </form>
    </div>
  );
}
