import { useEffect, useState } from "react";
import { fetchDashboardData } from "../../services/dashboardApi";
import "./Dashboard.css"; 

const Dashboard = () => {
  const [data, setData] = useState({
    total_balance: 0,
    total_income: 0,
    total_expense: 0,
    monthly_income: 0,
    monthly_expense: 0,
    savings_rate: 0,
    recent_transactions: [],
    budget_alerts: [],
  });

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await fetchDashboardData();
        if (!dashboardData) throw new Error("Failed to fetch dashboard data");
        setData({
          total_balance: dashboardData.total_balance ?? 0,
          total_income: dashboardData.total_income ?? 0,
          total_expense: dashboardData.total_expense ?? 0,
          monthly_income: dashboardData.monthly_income ?? 0,
          monthly_expense: dashboardData.monthly_expense ?? 0,
          savings_rate: dashboardData.savings_rate ?? 0,
          recent_transactions: dashboardData.recent_transactions ?? [],
          budget_alerts: dashboardData.budget_alerts ?? [],
        });

        const accRes = await fetch("http://127.0.0.1:5000/api/accounts-with-balance");
        const accData = await accRes.json();
        setAccounts(accData ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;

  const totalAccountBalance = accounts.reduce(
    (sum, acc) => sum + (acc.current_balance ?? 0),
    0
  );

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
          <div className={`value ${totalAccountBalance >= 0 ? "positive" : "negative"}`}>
            ${totalAccountBalance.toFixed(2)}
          </div>
        </div>

        <div className="kpi-card">
          <h3>INITIAL AMOUNT</h3>
          <div className="value">${(data.total_balance ?? 0).toFixed(2)}</div>
        </div>

        <div className="kpi-card">
          <h3>INCOME (Month)</h3>
          <div className="value">${(data.monthly_income ?? 0).toFixed(2)}</div>
        </div>

        <div className="kpi-card">
          <h3>EXPENSES (Month)</h3>
          <div className="value">${(data.monthly_expense ?? 0).toFixed(2)}</div>
        </div>

        <div className="kpi-card">
          <h3>SAVINGS RATE</h3>
          <div className="value">{(data.savings_rate ?? 0).toFixed(1)}%</div>
        </div>

        <div className="chart-container">
          <div className="chart-header">CASH FLOW FORECAST</div>
          <div className="chart-placeholder">Chart Area (e.g., using Chart.js)</div>
          <div className="chart-footer">Next 30 Days Forecast</div>
        </div>
      </div>

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
                  <td style={{ textAlign: "right" }} className={acc.current_balance >= 0 ? "positive" : "negative"}>
                    ${ (acc.current_balance ?? 0).toFixed(2) }
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Total</strong></td>
                <td style={{ textAlign: "right" }}><strong>${totalAccountBalance.toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <div className="bottom-section">
        <div className="panel">
          <div className="panel-header">RECENT TRANSACTIONS</div>
          <div className="transaction-list">
            {data.recent_transactions.map((tx, idx) => (
              <div key={idx} className="transaction">
                <div className={`transaction-top ${tx.is_anomaly ? "anomaly" : ""}`}>
                  <span>{tx.name}</span>
                  <span className={`transaction-amount ${tx.amount >= 0 ? "positive" : "negative"}`}>
                    ${Math.abs(tx.amount ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="transaction-category">{tx.category}</div>
              </div>
            ))}
          </div>
          <a href="/transactions" className="view-all">View All Transactions →</a>
        </div>

        <div className="panel">
          <div className="panel-header">BUDGET ALERTS</div>
          <div className="budget-list">
            {data.budget_alerts.map((b, idx) => (
              <div key={idx} className="budget-item">
                <div className="budget-header">
                  <span className={`budget-status ${b.status}`}>{b.name}</span>
                </div>
                <div className="budget-progress">
                  ${b.spent ?? 0} / ${b.limit ?? 0}
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
