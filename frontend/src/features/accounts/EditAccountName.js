import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddEditAccount.css"; // reuse your CSS

const EditAccountName = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // account ID

  const [accountName, setAccountName] = useState("");

  // Fetch existing account name
  useEffect(() => {
    if (id) {
      fetch(`http://localhost:5000/api/accounts/${id}`)
        .then((res) => res.json())
        .then((data) => setAccountName(data.name))
        .catch((err) => console.error("Error fetching account:", err));
    }
  }, [id]);

  const handleSave = async () => {
    if (!accountName.trim()) {
      alert("Account name cannot be empty");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: accountName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account name updated successfully!");
        navigate("/accounts");
      } else {
        alert("Error: " + (data.error || "Something went wrong."));
      }
    } catch (err) {
      alert("Failed to save account. Please try again later.");
      console.error(err);
    }
  };

  return (
    <div className="add-account-container">
      <div className="add-account-header">EDIT ACCOUNT NAME</div>

      <div className="form-group">
        <label>Account Name:</label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
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

export default EditAccountName;
