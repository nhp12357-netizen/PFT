import React, { useEffect, useState } from "react";
import { fetchAccounts } from "../../services/accountApi";
import "./Accounts.css"; 
import { useNavigate } from "react-router-dom";

const Accounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);

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

  const handleAddAccount = async () => {
    const name = prompt("Enter account name:");
    if (!name) return;

    const type = prompt("Enter account type (e.g., Savings, Checking):");
    if (!type) return;
    const type_upper = type.toUpperCase();

    const initial_balance_str = prompt("Enter initial balance:");
    const initial_balance = parseFloat(initial_balance_str) || 0;

    try {
      const res = await fetch("http://localhost:5000/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type: type_upper, initial_balance }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account added successfully!");
        loadAccounts(); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to add account.");
    }
  };

  const handleEdit = async (account) => {
    setEditingAccount(account);
    const name = prompt("Edit account name:", account.name);
    if (!name) return;

    const type = prompt("Edit account type:", account.type);
    if (!type) return;

    const initial_balance_str = prompt("Edit initial balance:", account.initial_balance);
    const initial_balance = parseFloat(initial_balance_str) || account.initial_balance;

    try {
      const res = await fetch(`http://localhost:5000/api/accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type, initial_balance }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Account updated successfully!");
        loadAccounts();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to update account.");
    }
  };

  const viewTransactions = (account) => {
    navigate(`/transactions/${account.id}`);
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
        <button className="add-btn" onClick={() => navigate("/accounts/add")}>
  Add New Account
</button>

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
              <button className="account-btn" onClick={() => handleEdit(a)}>Edit</button>
              <button className="account-btn" onClick={() => viewTransactions(a)}>View Transactions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
