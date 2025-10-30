import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./Transactions.module.css";

function Transactions() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTransactions();
    // eslint-disable-next-line
  }, [accountId, selectedAccount, selectedCategory, selectedMonth, selectedYear]);

  // === Fetch accounts ===
  const fetchAccounts = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch accounts:", err);
    }
  };

  // === Fetch categories ===
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/api/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  // === Fetch transactions ===
  const fetchTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      let url = "http://127.0.0.1:5000/api/transactions";
      const params = new URLSearchParams();

      // Filters
      if (accountId && selectedAccount === "all") {
        params.append("accountId", accountId);
      } else if (selectedAccount !== "all") {
        params.append("accountId", selectedAccount);
      }

      if (selectedCategory !== "all") params.append("categoryId", selectedCategory);
      if (search.trim()) params.append("description", search.trim());

      if (selectedMonth) {
        const [year, month] = selectedMonth.split("-");
        params.append("year", year);
        params.append("month", month.padStart(2, "0"));
      } else if (selectedYear) {
        params.append("year", selectedYear);
      }

      url += `?${params.toString()}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch transactions");
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  // === Delete transaction ===
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to delete transaction");

      alert("Transaction deleted successfully!");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Failed to delete transaction");
    }
  };

  return (
    <div className={styles.container}>
      <div className="header">PERSONAL FINANCE TRACKER</div>

      <div className="nav">
        <a href="/dashboard" className="nav-item">Dashboard</a>
        <a href="/transactions" className="nav-item active">Transactions</a>
        <a href="/accounts" className="nav-item">Accounts</a>
        <a href="/budget" className="nav-item">Budget</a>
        <a href="/reports" className="nav-item">Reports</a>
      </div>

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
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />

        <input
          type="text"
          placeholder="Search by Description..."
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
                    {tx.transaction_type === "INCOME" ? "+" : "-"}${tx.amount.toFixed(2)}
                  </td>
                  <td>
                    <button
                      className={styles.editBtn}
                      onClick={() => navigate(`/transactions/edit/${tx.id}`)}
                    >
                      ✏ Edit
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
