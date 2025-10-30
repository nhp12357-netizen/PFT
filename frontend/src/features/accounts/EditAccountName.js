import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddEditAccount.css"; // reuse your CSS

const EditAccountName = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // account ID

  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch existing account name
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      navigate("/login");
      return;
    }

    const fetchAccount = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:5000/api/accounts/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch account");
        setAccountName(data.name);
      } catch (err) {
        console.error("Error fetching account:", err);
        alert("Unable to load account details.");
        navigate("/accounts");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAccount();
  }, [id, navigate]);

  const handleSave = async () => {
    if (!accountName.trim()) {
      alert("Account name cannot be empty");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/accounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: accountName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Account name updated successfully!");
        navigate("/accounts");
      } else {
        alert("❌ Error: " + (data.error || "Something went wrong."));
      }
    } catch (err) {
      console.error("Error updating account:", err);
      alert("Failed to save account. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;

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
        <button
          className="cancel-btn"
          onClick={() => navigate("/accounts")}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default EditAccountName;
