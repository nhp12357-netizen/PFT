import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AddTransaction.css"; 
import { fetchCategories, fetchAccounts, addTransaction } from "../../services/transactionApi";

const AddTransaction = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: "",
    description: "",
    amount: "",
    category_id: "",
    account_id: "",
  });

  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  // Fetch dropdown values when page loads
  useEffect(() => {
    async function loadData() {
      try {
        const [cats, accts] = await Promise.all([
          fetchCategories(),
          fetchAccounts()
        ]);
        setCategories(cats);
        setAccounts(accts);
      } catch {
        setError("Failed to load categories or accounts.");
      }
    }
    loadData();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit form to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await addTransaction(formData);
      if (res && res.success) {
        setSuccess("Transaction added successfully!");
        setTimeout(() => navigate("/transactions"), 1000);
      } else {
        setError("Failed to add transaction.");
      }
    } catch {
      setError("Failed to submit transaction.");
    }
  };

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="page-header">
        <div className="page-title">ADD TRANSACTION</div>
        <button className="add-btn" onClick={() => navigate("/transactions")}>
          Back to Transactions
        </button>
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            name="description"
            required
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            step="0.01"
            name="amount"
            required
            placeholder="Enter amount"
            value={formData.amount}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category_id"
            required
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Account</label>
          <select
            name="account_id"
            required
            value={formData.account_id}
            onChange={handleChange}
          >
            <option value="">-- Select Account --</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="add-btn">Save Transaction</button>
      </form>
    </div>
  );
};

export default AddTransaction;
