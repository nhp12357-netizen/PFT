import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchBudgets } from "../../services/budgetApi";
import "./Budget.css";

export default function BudgetPage() {
  const navigate = useNavigate();

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBudgets();
  }, [month]);

  const loadBudgets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBudgets(month);
      setBudgets(data);
    } catch (err) {
      console.error("❌ Failed to load budgets:", err);
      setError("Failed to load budgets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = () => navigate("/budget/set");

  const formatCurrency = (num) =>
    `$${Number(num).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;

  if (loading) return <p style={{ padding: "20px" }}>Loading budgets...</p>;
  if (error)
    return <p style={{ color: "red", padding: "20px" }}>{error}</p>;

  const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
  };

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <div className="nav-left">
          <a href="/dashboard" className="nav-item">Dashboard</a>
          <a href="/transactions" className="nav-item ">Transactions</a>
          <a href="/accounts" className="nav-item ">Accounts</a>
          <a href="/budget" className="nav-item active">Budget</a>
          <a href="/reports" className="nav-item">Reports</a>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Month selector */}
      <div className="filter-bar">
        <label>Select Month:</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div style={{ padding: "16px" }}>
        <button className="btn btn-save" onClick={handleSetBudget}>
          ➕ Set Budget
        </button>
      </div>

      <div className="table-container">
        {budgets.length === 0 ? (
          <p style={{ padding: "10px" }}>No budgets found for {month}.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => {
                const remaining = b.limit_amount - b.spent;
                const pct =
                  b.limit_amount > 0
                    ? Math.round((b.spent / b.limit_amount) * 100)
                    : 0;

                return (
                  <tr key={b.category_id}>
                    <td>{b.category_name}</td>
                    <td>{formatCurrency(b.limit_amount)}</td>
                    <td>{formatCurrency(b.spent)}</td>
                    <td
                      className={
                        remaining >= 0
                          ? "remaining-positive"
                          : "remaining-negative"
                      }
                    >
                      {formatCurrency(remaining)}
                    </td>
                    <td>
                      <div className="progress-container">
                        <div
                          className={`progress-bar ${
                            pct > 100
                              ? "progress-over"
                              : pct >= 90
                              ? "progress-warning"
                              : "progress-ok"
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                      <div className="percentage">({pct}%)</div>
                      {pct > 100 && (
                        <div className="warning-text warning-over">
                          OVER BUDGET!
                        </div>
                      )}
                      {pct === 100 && (
                        <div className="warning-text warning-at-limit">
                          AT LIMIT!
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
