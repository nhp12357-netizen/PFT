import { useEffect, useState } from "react";
import { fetchDashboardData } from "../../services/dashboardApi";
import "./Dashboard.css"; 

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    // Fetch main dashboard data
    fetchDashboardData()
      .then((res) => {
        if (!res) {
          setError("Failed to fetch dashboard data.");
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Failed to fetch dashboard data."));

    // Fetch accounts with balance
    fetch("http://localhost:5000/api/accounts-with-balance")
      .then((res) => res.json())
      .then((data) => setAccounts(data))
      .catch(() => console.error("Failed to fetch accounts with balance"));
  }, []);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (!data) return <p style={{ padding: "20px" }}>Loading...</p>;

  // Calculate total balance from accounts list
  const totalAccountBalance = accounts.reduce(
    (sum, acc) => sum + acc.current_balance,
    0
  );

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

      {/* KPI Cards */}
      <div className="dashboard-grid">
        {/* Current Balance */}
        <div className="kpi-card">
          <h3>TOTAL BALANCE</h3>
          <div
            className={`value ${
              totalAccountBalance >= 0 ? "positive" : "negative"
            }`}
          >
            ${totalAccountBalance.toFixed(2)}
          </div>
        </div>

        {/* Total Balance */}
        <div className="kpi-card">
          <h3>INITIAL AMOUNT</h3>
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

      {/* Accounts Overview */}
      <div className="panel" style={{ marginTop: "30px" }}>
        <div className="panel-header">ACCOUNTS OVERVIEW</div>
        {accounts.length === 0 ? (
          <p style={{ padding: "10px" }}>No accounts found.</p>
        ) : (
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Current Balance</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>{acc.name}</td>
                  <td>{acc.type}</td>
                  <td
                    style={{ textAlign: "right" }}
                    className={acc.current_balance >= 0 ? "positive" : "negative"}
                  >
                    ${acc.current_balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Total</strong></td>
                <td style={{ textAlign: "right" }}>
                  <strong>${totalAccountBalance.toFixed(2)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Bottom Section */}
      <div className="bottom-section">
        {/* Recent Transactions */}
        <div className="panel">
          <div className="panel-header">RECENT TRANSACTIONS</div>
          <div className="transaction-list">
            {data.recent_transactions.map((tx, idx) => (
              <div key={idx} className="transaction">
                <div className={`transaction-top ${tx.is_anomaly ? "anomaly" : ""}`}>
                  <span>{tx.name}</span>
                  <span
                    className={`transaction-amount ${
                      tx.amount >= 0 ? "positive" : "negative"
                    }`}
                  >
                    ${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
                <div className="transaction-category">{tx.category}</div>
              </div>
            ))}
          </div>
          <a href="/transactions" className="view-all">
            View All Transactions →
          </a>
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
                <div className="budget-progress">
                  ${b.spent} / ${b.limit}
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
