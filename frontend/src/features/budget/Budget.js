import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 

import { fetchBudgets } from "../../services/budgetApi";


import "./Budget.css";

function Budget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();  

  useEffect(() => {
    fetchBudgets()
      .then(data => setBudgets(data))
      .catch(err => {
        console.error(err);
        setError("Failed to fetch budgets");
      })
      .finally(() => setLoading(false));
  }, []);

  const getProgressClass = (percentage) => {
    if (percentage >= 100) return "progress-over";
    if (percentage >= 75) return "progress-warning";
    return "progress-ok";
  };

  if (loading) return <p>Loading budgets...</p>;
  if (error) return <p style={{color:"red"}}>{error}</p>;

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

      <h2>BUDGET MANAGEMENT</h2>

      {/* ✅ Add this button */}
      <button 
        className="go-set-btn"
        onClick={() => navigate("/budget/set")}
      >
        + Set Budget
      </button>

      <table>
        <thead>
          <tr>
            <th>CATEGORY</th>
            <th>BUDGET</th>
            <th>SPENT</th>
            <th>REMAINING</th>
            <th>PROGRESS</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => (
            <tr key={b.id}>
              <td>{b.category}</td>
              <td>${b.budget}</td>
              <td>${b.spent}</td>
              <td className={b.remaining >= 0 ? "remaining-positive" : "remaining-negative"}>
                ${b.remaining}
              </td>
              <td>
                <div className="progress-container">
                  <div className={`progress-bar ${getProgressClass(b.percentage)}`} style={{width: `${b.percentage}%`}}></div>
                </div>
                <div className="percentage">({b.percentage}%)</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Budget;