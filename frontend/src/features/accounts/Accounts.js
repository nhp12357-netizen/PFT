import React, { useEffect, useState } from "react";
import { fetchAccounts, deleteAccount, getTransactionsByAccount } from "../../services/accountApi";
import "./Accounts.css";
import { useNavigate } from "react-router-dom";

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const res = await fetchAccounts();
      if (!res) setError("Failed to fetch accounts.");
      else setAccounts(res);
    } catch {
      setError("Failed to fetch accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    navigate("/accounts/add");
  };

  const handleEdit = (accountId) => {
    navigate(`/accounts/edit/${accountId}`);
  };

  const handleDelete = async (accountId) => {
    // Check if account has transactions
    const transactions = await getTransactionsByAccount(accountId);
    if (transactions.length > 0) {
      alert("Cannot delete account with linked transactions.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this account? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await deleteAccount(accountId);
      if (res.success) {
        alert("Account deleted successfully!");
        loadAccounts(); // refresh list
      } else {
        alert(res.error || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };

  const viewTransactions = (accountId) => {
    navigate(`/transactions?accountId=${accountId}`);
  };

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
        <button className="add-btn" onClick={handleAddAccount}>
          Add New Account
        </button>
      </div>

      <div className="accounts-container">
        {accounts.map((a) => (
          <div key={a.id} className="account-card">
            <div className="account-header">
              <div className="account-name">{a.name.toUpperCase()}</div>
              <div
                className={`account-balance ${
                  a.current_balance >= 0 ? "positive" : "negative"
                }`}
              >
                {a.current_balance >= 0
                  ? `$${a.current_balance.toFixed(2)}`
                  : `-$${Math.abs(a.current_balance).toFixed(2)}`}
              </div>
            </div>
            <div className="account-type">
              {a.type.charAt(0).toUpperCase() + a.type.slice(1).toLowerCase()} Account
            </div>
            <div className="account-details">
              Initial: ${a.initial_balance.toFixed(2)} | Current: ${a.current_balance.toFixed(2)}
            </div>
            <div className="account-actions">
              <button className="account-btn" onClick={() => handleEdit(a.id)}>Edit</button>
              <button className="account-btn" onClick={() => viewTransactions(a.id)}>View Transactions</button>
          <button className="account-btn delete" onClick={() => navigate(`/accounts/delete/${a.id}`)}>
      Delete
    </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
