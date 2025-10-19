import { useEffect, useState } from "react";
import { fetchDashboardData } from "../../services/api";
import "./Dashboard.css"; // <-- import the CSS

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData()
      .then(res => {
        if (!res) setError("Failed to fetch dashboard data.");
        else setData(res);
      })
      .catch(() => setError("Failed to fetch dashboard data."));
  }, []);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (!data) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>
      <div className="nav">
        <a href="/" className="nav-item active">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="dashboard-grid">
        <div className="kpi-card">
          <h3>TOTAL BALANCE</h3>
          <div className="value">${data.total_balance}</div>
        </div>
        <div className="kpi-card">
          <h3>INCOME (Month)</h3>
          <div className="value">${data.monthly_income}</div>
        </div>
        <div className="chart-container">
          <div className="chart-header">CASH FLOW FORECAST</div>
          <div className="chart-placeholder">Chart Area (e.g., Chart.js)</div>
          <div className="chart-footer">Next 30 Days Forecast</div>
        </div>
        <div className="kpi-card">
          <h3>EXPENSES (Month)</h3>
          <div className="value">${data.monthly_expense}</div>
        </div>
        <div className="kpi-card">
          <h3>SAVINGS RATE</h3>
          <div className="value">{data.savings_rate}%</div>
        </div>
      </div>

      <div className="bottom-section">
        <div className="panel">
          <div className="panel-header">RECENT TRANSACTIONS</div>
          <div className="transaction-list">
            {data.recent_transactions.map((t, i) => (
              <div className="transaction" key={i}>
                <div className={`transaction-top ${t.is_anomaly ? "anomaly" : ""}`}>
                  <span>{t.name}</span>
                  <span className={`transaction-amount ${t.amount >= 0 ? "positive" : "negative"}`}>
                    ${Math.abs(t.amount)}
                  </span>
                </div>
                <div className="transaction-category">{t.category}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">BUDGET ALERTS</div>
          <div className="budget-list">
            {data.budget_alerts.map((b, i) => (
              <div className="budget-item" key={i}>
                <div className="budget-header">
                  <span className={`budget-status ${b.status}`}>{b.name}</span>
                </div>
                <div className="budget-progress">
                  ${b.spent} / ${b.limit} ({Math.round((b.spent / b.limit) * 100)}% used)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
