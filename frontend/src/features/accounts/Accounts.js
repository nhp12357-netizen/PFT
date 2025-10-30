import React, { useEffect, useState } from "react";
import {
  deleteAccount,
  getTransactionsByAccount,
  setDefaultAccount,
  getDefaultAccount,
  fetchAccounts,
} from "../../services/accountApi";
import { useNavigate } from "react-router-dom";
import "./Accounts.css";

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [defaultAccount, setDefault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load accounts and default account
  useEffect(() => {
    loadAccounts();
    loadDefaultAccount();
  }, []);

  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:5000/api/accounts", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch accounts");
      setAccounts(data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Load accounts error:", err);
      setError("Failed to fetch accounts.");
      setLoading(false);
    }
  };

  const loadDefaultAccount = async () => {
    try {
      const data = await getDefaultAccount();
      setDefault(data);
    } catch (err) {
      setDefault(null); // No default set yet
    }
  };

  const handleAddAccount = () => navigate("/accounts/add");
  const handleEdit = (accountId) => navigate(`/accounts/edit/${accountId}`);

  const handleDelete = async (accountId) => {
    const transactions = await getTransactionsByAccount(accountId);
    if (transactions.length > 0) {
      alert("Cannot delete account with linked transactions.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this account?")) return;

    try {
      const res = await deleteAccount(accountId);
      if (res.success) {
        alert("Account deleted successfully!");
        loadAccounts();
      } else {
        alert(res.error || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };

  const handleSetDefault = async (accountId) => {
    try {
      await setDefaultAccount(accountId);
      alert("Account set as default successfully!");
      loadDefaultAccount();
      loadAccounts();
    } catch (err) {
      console.error("Error setting default:", err);
      alert("Failed to set default account.");
    }
  };

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  const totalInitialBalance = accounts.reduce(
    (sum, acc) => sum + (acc.initial_balance || 0),
    0
  );
  const totalCurrentBalance = accounts.reduce(
    (sum, acc) => sum + (acc.current_balance || 0),
    0
  );

  return (
    <div className="container">
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/dashboard" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item">Transactions</a>
        <a href="/accounts" className="nav-item active">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      <div className="page-header">
        <div className="page-title">ACCOUNTS</div>
        <button className="add-btn" onClick={handleAddAccount}>Add New Account</button>
      </div>

      <div className="accounts-table-container">
        {accounts.length === 0 ? (
          <p style={{ padding: "10px" }}>No accounts found.</p>
        ) : (
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Type</th>
                <th style={{ textAlign: "right" }}>Initial Balance</th>
                <th style={{ textAlign: "right" }}>Current Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>
                    {acc.name}{" "}
                    {defaultAccount && defaultAccount.id === acc.id && (
                      <span className="default-badge">⭐ Default</span>
                    )}
                  </td>
                  <td>
                    {acc.type
                      ? acc.type.charAt(0).toUpperCase() +
                        acc.type.slice(1).toLowerCase()
                      : ""}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    ${acc.initial_balance?.toFixed(2) || "0.00"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    ${acc.current_balance?.toFixed(2) || "0.00"}
                  </td>
                  <td>
                    <button
                      className="account-btn"
                      onClick={() => handleEdit(acc.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="account-btn delete"
                      onClick={() => handleDelete(acc.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="account-btn"
                      onClick={() => handleSetDefault(acc.id)}
                    >
                      {defaultAccount && defaultAccount.id === acc.id
                        ? "Default"
                        : "Set as Default"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="2"><strong>Total</strong></td>
                <td style={{ textAlign: "right" }}>
                  <strong>${totalInitialBalance.toFixed(2)}</strong>
                </td>
                <td style={{ textAlign: "right" }}>
                  <strong>${totalCurrentBalance.toFixed(2)}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default Accounts;
