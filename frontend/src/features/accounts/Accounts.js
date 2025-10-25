import React, { useEffect, useState } from "react";
import { deleteAccount, getTransactionsByAccount } from "../../services/accountApi";
import { useNavigate } from "react-router-dom";
import "./Accounts.css";

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Load accounts with dynamic balance
  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/accounts-with-balance")
      .then((res) => res.json())
      .then((data) => {
        console.log("Accounts with balance:", data);
        setAccounts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch accounts.");
        setLoading(false);
      });
  }, []);

  const handleAddAccount = () => navigate("/accounts/add");
  const handleEdit = (accountId) => navigate(`/accounts/edit/${accountId}`);
  const viewTransactions = (accountId) => navigate(`/transactions?accountId=${accountId}`);

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
        // Reload updated balances
        fetch("http://127.0.0.1:5000/api/accounts-with-balance")
          .then((res) => res.json())
          .then((data) => setAccounts(data));
      } else {
        alert(res.error || "Failed to delete account.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete account.");
    }
  };

  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;
  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

  // ✅ Total of current balances
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);

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
                  <td>{acc.name}</td>
                  <td>{acc.type.charAt(0).toUpperCase() + acc.type.slice(1).toLowerCase()}</td>
                  <td style={{ textAlign: "right" }}>${acc.initial_balance}</td>
                  <td style={{ textAlign: "right" }}>${acc.current_balance}</td>
                  <td>
                    <button className="account-btn" onClick={() => handleEdit(acc.id)}>Edit</button>
                    <button className="account-btn" onClick={() => viewTransactions(acc.id)}>View</button>
                    <button className="account-btn delete" onClick={() => handleDelete(acc.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td style={{ textAlign: "right" }}><strong>${totalBalance}</strong></td>
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
