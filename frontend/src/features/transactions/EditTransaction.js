import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchCategories } from "../../services/categoriesApi";
import { fetchAccounts } from "../../services/accountApi";
import { fetchTransactions, updateTransaction } from "../../services/transactionApi";

export default function EditTransaction() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount: "",
    account_id: "",
    category_id: "",
    transaction_type: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [acc, cat, txns] = await Promise.all([
      fetchAccounts(),
      fetchCategories(),
      fetchTransactions(),
    ]);
    setAccounts(acc);
    setCategories(cat);
    const txn = txns.find((t) => t.id == id);
    if (txn) setFormData(txn);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const success = await updateTransaction(id, formData);
      if (success) {
        alert("Transaction updated successfully!");
        navigate("/transactions");
      }
    } catch (err) {
      alert("Failed to update transaction: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Edit Transaction</h2>
      <form onSubmit={handleSubmit}>
        <input type="date" name="date" value={formData.date} onChange={handleChange} />
        <input
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description"
        />
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="Amount"
        />
        <select name="account_id" value={formData.account_id} onChange={handleChange}>
          <option value="">Select Account</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select name="category_id" value={formData.category_id} onChange={handleChange}>
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
        <button type="submit">Save</button>
        <button type="button" onClick={() => navigate("/transactions")}>
          Cancel
        </button>
      </form>
    </div>
  );
}
