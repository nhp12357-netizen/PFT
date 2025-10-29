import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchBudgets,
  saveBudgets,
  fetchRecommendedBudgets,
} from "../../services/budgetApi";
import "./SetBudget.css";

export default function SetBudgetPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [budgets, setBudgets] = useState([]);
  const [message, setMessage] = useState("");
  const [recommendations, setRecommendations] = useState({});
  const navigate = useNavigate();

  // 🔹 Load budgets whenever month changes
  useEffect(() => {
    loadBudgets();
  }, [month]);

  // 🔹 Load recommended budgets once
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recs = await fetchRecommendedBudgets();
        setRecommendations(recs || {});
      } catch (err) {
        console.error("Failed to load recommendations", err);
      }
    };
    loadRecommendations();
  }, []);

  // 🔹 Fetch existing budgets
  const loadBudgets = async () => {
    try {
      const data = await fetchBudgets(month);
      setBudgets(data);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to load budgets");
    }
  };

  // 🔹 Cancel button navigation
  const cancelBudgets = () => {
    navigate("/budget");
  };

  // 🔹 Handle input change
  const handleBudgetChange = (index, value) => {
    const copy = [...budgets];
    copy[index].limit_amount = value;
    setBudgets(copy);
  };

  // 🔹 Save budget for all months of selected year
  const handleSave = async () => {
    try {
      const [year] = month.split("-");
      const payload = budgets.map((b) => ({
        category_id: b.category_id,
        limit_amount: Number(b.limit_amount),
        year: parseInt(year),
        apply_all_months: true, // 🔸 tell backend to set for all 12 months
      }));

      await saveBudgets(payload);
      setMessage(`✅ Budget applied to all months of ${year}`);
      setTimeout(() => navigate("/budget"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save budgets");
    }
  };

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      {/* 🔹 Navigation bar */}
      <div className="nav">
        <a href="/" className="nav-item">
          Dashboard
        </a>
        <a href="/transactions" className="nav-item">
          Transactions
        </a>
        <a href="/accounts" className="nav-item">
          Accounts
        </a>
        <a href="/budget" className="nav-item active">
          Budget
        </a>
        <a href="/reports" className="nav-item">
          Reports
        </a>
      </div>

      {/* 🔹 Form Section */}
      <div className="form-container">
        <div className="form-title">
          Set Budget for{" "}
          {new Date(month + "-01").toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </div>

        {budgets.map((b, idx) => (
          <div key={b.category_id} className="budget-category">
            <div className="category-name">{b.category_name}</div>
            {recommendations[b.category_id] && (
              <div className="category-info">
                Recommended: ${recommendations[b.category_id]}
              </div>
            )}
            <input
              type="number"
              className="input-field"
              value={b.limit_amount || ""}
              onChange={(e) =>
                handleBudgetChange(idx, Number(e.target.value))
              }
            />
          </div>
        ))}

        {message && (
          <p style={{ textAlign: "center", marginTop: "12px" }}>{message}</p>
        )}

        <div className="form-footer">
          <button className="btn btn-cancel" onClick={cancelBudgets}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={handleSave}>
            Save Budget
          </button>
        </div>
      </div>
    </div>
  );
}
