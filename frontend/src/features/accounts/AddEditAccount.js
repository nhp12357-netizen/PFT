import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddEditAccount.css"; // reuse the same CSS

const AddEditAccount = () => {
  const navigate = useNavigate();

  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState("CHECKING");
  const [initialBalance, setInitialBalance] = useState(0);

  const handleSave = async () => {
    if (!accountName.trim()) {
      alert("Account name cannot be empty!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accountName,
          type: accountType,
          initial_balance: parseFloat(initialBalance) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account added successfully!");
        navigate("/accounts");
      } else {
        alert("Error: " + (data.error || "Something went wrong."));
      }
    } catch (err) {
      alert("Failed to add account. Please try again later.");
      console.error(err);
    }
  };

  return (
    <div className="add-account-container">
      <div className="add-account-header">ADD ACCOUNT</div>

      <div className="form-group">
        <label>Account Name:</label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Account Type:</label>
        <select
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="CHECKING">Checking</option>
          <option value="SAVINGS">Savings</option>
          <option value="CREDIT_CARD">Credit Card</option>
        </select>
      </div>

      <div className="form-group">
        <label>Initial Balance:</label>
        <input
          type="number"
          value={initialBalance}
          onChange={(e) => setInitialBalance(e.target.value)}
        />
      </div>

      <div className="form-actions">
        <button className="cancel-btn" onClick={() => navigate("/accounts")}>
          Cancel
        </button>
        <button className="save-btn" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
};

export default AddEditAccount;
