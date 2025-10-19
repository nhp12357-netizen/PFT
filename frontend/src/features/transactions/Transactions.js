import React, { useEffect, useState } from "react";
import { fetchTransactions } from "../../services/transactionApi";
import "./Transactions.css"; // your CSS copied from HTML

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null); // define error state
  const [loading, setLoading] = useState(true); // loading state

  useEffect(() => {
    fetchTransactions()
      .then((res) => {
        if (!res) {
          setError("Failed to fetch transactions.");
        } else {
          setTransactions(res);
        }
      })
      .catch(() => setError("Failed to fetch transactions."))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item active">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="page-header">
        <div className="page-title">TRANSACTIONS</div>
        <button className="add-btn">Add Transaction</button>
      </div>

      <div className="filters">{/* Filters remain static */}</div>

      <div className="search-container">
        <span className="search-icon">🔍</span>
        <input type="text" className="search-input" placeholder="Description..." />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>DESCRIPTION</th>
              <th>CATEGORY</th>
              <th>ACCOUNT</th>
              <th>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className={t.is_anomaly ? "anomaly-row" : ""}>
                <td>{t.date}</td>
                <td>
                  {t.description}
                  {t.is_anomaly && (
                    <>
                      <span className="anomaly-warning">ANOMALY - Large amount</span>
                      <div className="anomaly-actions">
                        <button className="anomaly-btn">Mark as Normal</button>
                        <button className="anomaly-btn">Ignore</button>
                      </div>
                    </>
                  )}
                </td>
                <td>{t.category}</td>
                <td>{t.account}</td>
                <td className={`amount ${t.amount >= 0 ? "positive" : "negative"}`}>
                  {t.amount >= 0 ? `+$${t.amount}` : `-$${Math.abs(t.amount)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-info">
          Showing 1-{transactions.length} of {transactions.length} transactions
        </div>
        <div className="pagination-controls">
          <button className="page-btn">‹</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">›</button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
