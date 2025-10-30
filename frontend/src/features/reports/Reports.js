import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { fetchReport } from "../../services/reportApi";
import "./Reports.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AA336A",
  "#8884D8",
];

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchReport(month);
        setReportData(data || []);
      } catch (err) {
        console.error("Failed to load report:", err);
        setError("Failed to load report data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [month]);

  const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.href = "/";
  };

  return (
    <div>
      <div className="header">PERSONAL FINANCE TRACKER</div>

      {/* Navigation bar */}
      <div className="nav">
        <div className="nav-left">
          <a href="/dashboard" className="nav-item">Dashboard</a>
          <a href="/transactions" className="nav-item">Transactions</a>
          <a href="/accounts" className="nav-item">Accounts</a>
          <a href="/budget" className="nav-item">Budget</a>
          <a href="/reports" className="nav-item active">Reports</a>
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
        <h2>Monthly Spending Report</h2>

        {/* Month selector */}
        <div style={{ marginBottom: "20px" }}>
          <label htmlFor="month">Select Month: </label>
          <input
            type="month"
            id="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : reportData.length === 0 ? (
          <p>No report data found for {month}.</p>
        ) : (
          <>
            <table
              border="1"
              cellPadding="8"
              style={{
                borderCollapse: "collapse",
                width: "100%",
                marginBottom: "40px",
              }}
            >
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Spent</th>
                  <th>Budget</th>
                  <th>Difference</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row) => (
                  <tr key={row.category_id}>
                    <td>{row.category_name}</td>
                    <td>₹{row.total_spent?.toFixed(2)}</td>
                    <td>
                      {row.budget ? `₹${row.budget.toFixed(2)}` : "-"}
                    </td>
                    <td
                      style={{
                        color: row.difference < 0 ? "red" : "green",
                        fontWeight: 500,
                      }}
                    >
                      {row.difference != null
                        ? `₹${row.difference.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>Spending Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData}
                  dataKey="total_spent"
                  nameKey="category_name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {reportData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
