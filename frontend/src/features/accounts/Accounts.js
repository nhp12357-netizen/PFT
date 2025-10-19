import React, { useEffect, useState } from "react";
import { fetchAccounts } from "../../services/accountApi";
import "./Accounts.css"; // CSS copied from your HTML

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccounts()
      .then((res) => {
        if (!res) setError("Failed to fetch accounts.");
        else setAccounts(res);
      })
      .catch(() => setError("Failed to fetch accounts."))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item active">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="page-header">
        <div className="page-title">ACCOUNTS</div>
        <button className="add-btn">Add New Account</button>
      </div>

      <div className="accounts-container">
        {accounts.map((a) => (
          <div key={a.id} className="account-card">
            <div className="account-header">
              <div className="account-name">{a.name.toUpperCase()}</div>
              <div className={`account-balance ${a.current_balance >= 0 ? "positive" : "negative"}`}>
                {a.current_balance >= 0
                  ? `$${a.current_balance.toFixed(2)}`
                  : `-$${Math.abs(a.current_balance).toFixed(2)}`}
              </div>
            </div>
            <div className="account-type">
              <div className="account-type-icon"></div>
              {a.type.charAt(0).toUpperCase() + a.type.slice(1).toLowerCase()} Account
            </div>
            <div className="account-details">
              Initial Balance: ${a.initial_balance.toFixed(2)} | Current: ${a.current_balance.toFixed(2)}
            </div>
            <div className="account-actions">
              <button className="account-btn">Edit</button>
              <button className="account-btn">View Transactions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
