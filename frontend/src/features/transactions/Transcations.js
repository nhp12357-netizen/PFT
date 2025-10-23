import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";
import { deleteTransaction } from "../../services/transactionApi";

function Transactions() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTransactions();
    // eslint-disable-next-line
  }, [accountId, selectedAccount, selectedCategory]);

  // === Fetch all accounts ===
  const fetchAccounts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  // === Fetch all categories ===
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // === Fetch filtered transactions ===
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
        params.append("search", search.trim());
      }

      url += `?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch transactions");
    }

    setLoading(false);
  };

  // ===== Handle Delete Transaction =====
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    const deleted = await deleteTransaction(id);
    if (deleted) fetchTransactions();
  };

  return (
    <div className={styles.container}>
      {/* === Header === */}
      <div className="header">PERSONAL FINANCE TRACKER</div>

      {/* === Navigation === */}
      <div className="nav">
        <a href="/" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item active">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

      {/* === Page Header === */}
      <div className={styles.header}>
        <h2>Transactions</h2>
        <div>
          <button
            className={styles.addBtn}
            onClick={() => navigate("/transactions/add")}
          >
            + Add Transaction
          </button>
          <button
            className={styles.addBtn}
            style={{ marginLeft: "10px", backgroundColor: "#007bff" }}
            onClick={() => navigate("/categories")}
          >
            🗂 Manage Categories
          </button>
        </div>
      </div>

      {/* === Filters === */}
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
          placeholder="Search by Description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={fetchTransactions}>🔍 Search</button>
      </div>

      {/* === Transactions Table === */}
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
              <th>Actions</th>
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
                      tx.transaction_type === "INCOME"
                        ? styles.income
                        : styles.expense
                    }
                  >
                    {tx.transaction_type === "INCOME" ? "+" : "-"}$
                    {tx.amount.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className={styles.editBtn}
                      onClick={() =>
                        navigate(`/transactions/edit/${tx.id}`)
                      }
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(tx.id)}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>
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
