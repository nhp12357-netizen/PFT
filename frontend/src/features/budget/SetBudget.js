import React, { useEffect, useState } from "react";
import { fetchCategories } from "../../services/categoriesApi";
import { saveBudgets, fetchRecommendedBudgets } from "../../services/budgetApi";
import "./SetBudget.css";

function SetBudget() {
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [message, setMessage] = useState("");

  // Load categories + (optional existing budgets)
  useEffect(() => {
    fetchCategories().then((data) => {
      setCategories(data);
      // Default each category budget to 0
      const initial = {};
      data.forEach((cat) => (initial[cat.id] = ""));
      setBudgets(initial);
    });
  }, []);

  // Apply recommended values from backend
  const handleApplyRecommendations = async () => {
    try {
      const recommendations = await fetchRecommendedBudgets();
      setBudgets(recommendations);
    } catch (err) {
      alert("Could not load recommendations");
    }
  };

const handleSave = async () => {
  try {
    const month = new Date().toISOString().slice(0, 7); // e.g., "2025-10"
    
    const budgetsToSave = Object.entries(budgets)
      .map(([key, value]) => {
        const amount = parseFloat(value);
        if (!value || isNaN(amount)) return null;
        return {
          category_id: parseInt(key),
          limit_amount: amount,
          month
        };
      })
      .filter(Boolean); // remove nulls

    await saveBudgets(budgetsToSave);
    setMessage("✅ Budgets saved successfully!");
  } catch (err) {
    setMessage("❌ Failed to save");
  }
};

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item active">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="form-container">
        <div className="form-title">SET BUDGET FOR OCTOBER 2024</div>

        {categories.map((cat) => (
          <div key={cat.id} className="budget-category">
            <div className="category-name">{cat.name}</div>
            <div className="category-info">Type: {cat.type}</div>
            <input
              type="number"
              className="input-field"
              placeholder="Enter budget"
              value={budgets[cat.id]}
              onChange={(e) =>
                setBudgets({ ...budgets, [cat.id]: e.target.value })
              }
            />
          </div>
        ))}

        <div className="apply-recommendations">
          <button className="apply-btn" onClick={handleApplyRecommendations}>
            Apply Recommendations
          </button>
        </div>

        {message && <p style={{ textAlign: "center" }}>{message}</p>}

        <div className="form-footer">
          <button className="btn btn-cancel">Cancel</button>
          <button className="btn btn-save" onClick={handleSave}>Save Budget</button>
        </div>
      </div>
    </div>
  );
}

export default SetBudget;