import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";

function Transactions() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTransactions();
  }, [accountId, selectedAccount, selectedCategory]);

  const fetchAccounts = async () => {
    const res = await fetch("http://localhost:5000/api/accounts");
    const data = await res.json();
    setAccounts(data);
  };

  const fetchCategories = async () => {
    const res = await fetch("http://localhost:5000/api/categories");
    const data = await res.json();
    setCategories(data);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "http://localhost:5000/api/transactions";
      const params = new URLSearchParams();

      if (accountId && selectedAccount === "all") {
        params.append("accountId", accountId);
      } else if (selectedAccount !== "all") {
        params.append("accountId", selectedAccount);
      }

      if (selectedCategory !== "all") {
        params.append("categoryId", selectedCategory);
      }

      if (search.trim()) {
        params.append("search", search);
      }

      url += `?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      setError("Failed to fetch transactions");
    }
    setLoading(false);
  };

  return (
    <div className={styles.pageContainer}>
    
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item active">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      
      <div className={styles.header}>
        <h2>Transactions</h2>
        <button
          className={styles.addBtn}
          onClick={() => navigate("/transactions/add")}
        >
          + Add Transaction
        </button>
      </div>

     
      <div className={styles.filters}>
        <select
          value={selectedAccount}
          onChange={(e) => setSelectedAccount(e.target.value)}
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search Description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={fetchTransactions}>🔍 Search</button>
      </div>

    
      {loading ? (
        <p style={{ textAlign: "center" }}>Loading transactions...</p>
      ) : error ? (
        <p style={{ textAlign: "center", color: "red" }}>{error}</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Account</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id}>
  <td>{tx.date}</td>
  <td>{tx.description}</td>
  <td>{tx.category || "-"}</td>
  <td>{tx.account_name || "-"}</td>
  <td
    className={
      tx.transaction_type === "INCOME" ? styles.income : styles.expense
    }
  >
    {tx.transaction_type === "INCOME" ? "+" : "-"}${tx.amount.toFixed(2)}
  </td>
</tr>

              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Transactions;
