import React, { useEffect, useState } from "react";
import axios from "axios";

function Reports() {
  const [report, setReport] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:5000/api/reports")
      .then(res => setReport(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!report) return <p>Loading...</p>;

  return (
    <div>
      <h2>Reports</h2>

      <div>
        <h3>Summary</h3>
        <p>Total Income: ${report.monthly_income}</p>
        <p>Total Expense: ${report.monthly_expense}</p>
        <p>Savings: ${report.savings}</p>
      </div>

      <div>
        <h3>Category-wise Expenses</h3>
        <ul>
          {report.category_expense.map((cat) => (
            <li key={cat.category}>{cat.category}: ${cat.spent}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Account Balances</h3>
        <ul>
          {report.accounts.map((acc) => (
            <li key={acc.name}>{acc.name}: ${acc.balance}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Reports;
