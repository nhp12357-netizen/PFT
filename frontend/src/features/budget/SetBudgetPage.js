import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ← add this
import { fetchBudgets, saveBudgets, fetchRecommendedBudgets } from "../../services/budgetApi";
import "./SetBudget.css";

export default function SetBudgetPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [budgets, setBudgets] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState({});

  // Load budgets when month changes
  useEffect(() => {
    loadBudgets();
  }, [month]);


  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const recs = await fetchRecommendedBudgets(); // call backend
        setRecommendations(recs); // recs is assumed to be a dict { category_id: limit_amount }
      } catch (err) {
        console.error("Failed to load recommendations", err);
      }
    };

    loadRecommendations();
  }, []);

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

  const cancelBudgets = async () => {
    navigate("/budget");
  };

  const handleBudgetChange = (index, value) => {
    const copy = [...budgets];
    copy[index].limit_amount = value;
    setBudgets(copy);
  };

  const handleSave = async () => {
    try {
      const [year, m] = month.split("-");
      const payload = budgets.map((b) => ({
        category_id: b.category_id,
        limit_amount: Number(b.limit_amount),
        month: parseInt(m),
        year: parseInt(year),
      }));
      await saveBudgets(payload);
  
      navigate("/budget");
      loadBudgets();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to save budgets");
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
        <div className="form-title">
          Set Budget For {new Date(month + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
        </div>

        {budgets.map((b, idx) => (
          <div key={b.category_id} className="budget-category">
            <div className="category-name">{b.category_name}</div>
            <div className="category-info">Budget Recommendation: ${recommendations[b.category_id]}</div>
            <input
              type="number"
              className="input-field"
              value={b.limit_amount}
              onChange={(e) => handleBudgetChange(idx, Number(e.target.value))}
            />
          </div>
        ))}


        {message && <p style={{ textAlign: "center", marginTop: "12px" }}>{message}</p>}

        <div className="form-footer">
          <button className="btn btn-cancel" onClick={cancelBudgets}>Cancel</button>
          <button className="btn btn-save" onClick={handleSave}>Save Budget</button>
        </div>
      </div>
    </div>
  );
}
