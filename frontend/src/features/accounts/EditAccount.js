import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const EditAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccount();
  }, []);

  const fetchAccount = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/accounts/${id}`);
      const data = await res.json();
      if (res.ok) {
        setAccount(data);
      } else {
        setError(data.error || "Failed to load account.");
      }
    } catch {
      setError("Failed to fetch account.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAccount({ ...account, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Account updated successfully!");
        navigate("/accounts");
      } else {
        alert("Error: " + data.error);
      }
    } catch {
      alert("Failed to update account.");
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;

  return (
    <div className="container">
      <div className="header">EDIT ACCOUNT</div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Account Name</label>
          <input
            type="text"
            name="name"
            value={account.name || ""}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Account Type</label>
          <select
            name="type"
            value={account.type || ""}
            onChange={handleChange}
            required
          >
            <option value="">Select type</option>
            <option value="CHECKING">Checking</option>
            <option value="SAVINGS">Savings</option>
            <option value="CREDIT_CARD">Credit Card</option>
          </select>
        </div>

        <div className="form-group">
          <label>Initial Balance</label>
          <input
            type="number"
            name="initial_balance"
            value={account.initial_balance || ""}
            onChange={handleChange}
            step="0.01"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn">Save Changes</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/accounts")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAccount;
