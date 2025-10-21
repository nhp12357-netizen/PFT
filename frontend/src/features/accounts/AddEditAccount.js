import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddEditAccount.css";

const AddEditAccount = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing an existing account

  const [account, setAccount] = useState({
    name: "",
    type: "CHECKING",
    initial_balance: "",
    color: "blue",
  });

  // Fetch existing account if in edit mode
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/accounts/${id}`)
        .then((res) => res.json())
        .then((data) => setAccount(data))
        .catch((err) => console.error("Error fetching account:", err));
    }
  }, [id]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccount({ ...account, [name]: value });
  };

  // Handle save
  const handleSave = async () => {
    if (!account.name || !account.initial_balance) {
      alert("Please fill in all fields");
      return;
    }

    const method = id ? "PUT" : "POST";
    const url = id
      ? `http://localhost:5000/api/accounts/${id}`
      : "http://localhost:5000/api/accounts";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Account ${id ? "updated" : "added"} successfully!`);
        navigate("/accounts");
      } else {
        if (data.error && data.error.includes("UNIQUE constraint failed")) {
          alert(
            "An account with this name already exists. Please choose a different name."
          );
        } else {
          alert("Error: " + (data.error || "Something went wrong."));
        }
      }
    } catch (err) {
      alert("Failed to save account. Please try again later.");
      console.error("Save account error:", err);
    }
  };

  return (
    <div className="add-account-container">
      <div className="add-account-header">
        {id ? "EDIT ACCOUNT" : "ADD ACCOUNT"}
      </div>

      <div className="form-group">
        <label>Account Name:</label>
        <input
          type="text"
          name="name"
          value={account.name}
          onChange={handleChange}
          placeholder="e.g. Primary Checking Account"
        />
      </div>

      <div className="form-group">
        <label>Account Type:</label>
        <select name="type" value={account.type} onChange={handleChange}>
          <option value="CHECKING">Checking</option>
          <option value="SAVINGS">Savings</option>
          <option value="CREDIT_CARD">Credit Card</option>
        </select>
      </div>

      <div className="form-group">
        <label>Initial Balance:</label>
        <input
          type="number"
          name="initial_balance"
          value={account.initial_balance}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label>Color:</label>
        <div className="color-options">
          {["blue", "red", "green", "yellow"].map((clr) => (
            <button
              key={clr}
              type="button"
              className={`color-btn ${clr} ${
                account.color === clr ? "selected" : ""
              }`}
              onClick={() => setAccount({ ...account, color: clr })}
            >
              ●
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button className="cancel-btn" onClick={() => navigate("/accounts")}>
          Cancel
        </button>
        <button className="save-btn" onClick={handleSave}>
          Save Account
        </button>
      </div>
    </div>
  );
};

export default AddEditAccount;
