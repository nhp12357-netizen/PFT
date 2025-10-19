import { useEffect, useState } from "react";
import { fetchDashboardData } from "../../services/api";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null); // <-- add error state

  useEffect(() => {
    fetchDashboardData()
      .then((res) => {
        if (!res) {
          setError("Failed to fetch dashboard data.");
        } else {
          setData(res);
        }
      })
      .catch(() => setError("Failed to fetch dashboard data."));
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>; // <-- show error
  if (!data) return <p>Loading...</p>; // still loading

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Dashboard Overview</h2>
      <div>
        <p><strong>Total Balance:</strong> ${data.total_balance}</p>
        <p><strong>Monthly Income:</strong> ${data.monthly_income}</p>
        <p><strong>Monthly Expenses:</strong> ${data.monthly_expense}</p>
        <p><strong>Savings Rate:</strong> {data.savings_rate}%</p>
      </div>
    </div>
  );
};

export default Dashboard;
