import { useEffect, useState } from "react";
import { fetchDashboardData } from "../../services/dashboardApi";
import "./Dashboard.css"; // make sure this file exists with your CSS

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData()
      .then((res) => {
        if (!res) {
          setError("Failed to fetch dashboard data.");
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Failed to fetch dashboard data."));
  }, []);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (!data) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="container">
      {/* Header */}
      <div className="header">PERSONAL FINANCE TRACKER</div>

      {/* Navigation */}
      <div className="nav">
        <a href="/" className="nav-item active">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      {/* KPI Cards + Chart */}
      <div className="dashboard-grid">
        <div className="kpi-card">
          <h3>TOTAL BALANCE</h3>
          <div className="value">${data.total_balance.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <h3>INCOME (Month)</h3>
          <div className="value">${data.monthly_income.toFixed(2)}</div>
        </div>
        <div className="chart-container">
          <div className="chart-header">CASH FLOW FORECAST</div>
          <div className="chart-placeholder">Chart Area (e.g., using Chart.js)</div>
          <div className="chart-footer">Next 30 Days Forecast</div>
        </div>
        <div className="kpi-card">
          <h3>EXPENSES (Month)</h3>
          <div className="value">${data.monthly_expense.toFixed(2)}</div>
        </div>
        <div className="kpi-card">
          <h3>SAVINGS RATE</h3>
          <div className="value">{data.savings_rate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Recent Transactions & Budget Alerts */}
      <div className="bottom-section">
        {/* Transactions */}
        <div className="panel">
          <div className="panel-header">RECENT TRANSACTIONS</div>
          <div className="transaction-list">
            {data.recent_transactions.map((tx, idx) => (
              <div key={idx} className="transaction">
                <div className={`transaction-top ${tx.is_anomaly ? "anomaly" : ""}`}>
                  <span>{tx.name}</span>
                  <span className={`transaction-amount ${tx.amount >= 0 ? "positive" : "negative"}`}>
                    ${Math.abs(tx.amount)}
                  </span>
                </div>
                <div className="transaction-category">{tx.category}</div>
              </div>
            ))}
          </div>
          <a href="/transactions" className="view-all">View All Transactions →</a>
        </div>

        {/* Budget Alerts */}
        <div className="panel">
          <div className="panel-header">BUDGET ALERTS</div>
          <div className="budget-list">
            {data.budget_alerts.map((b, idx) => (
              <div key={idx} className="budget-item">
                <div className="budget-header">
                  <span className={`budget-status ${b.status}`}>{b.name}</span>
                </div>
                <div className="budget-progress">${b.spent} / ${b.limit}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
