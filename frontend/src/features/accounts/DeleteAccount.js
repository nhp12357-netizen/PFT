import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTransactionsByAccount, deleteAccount } from "../../services/accountApi";

const DeleteAccount = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // === Fetch account details ===
        const res = await fetch(`http://127.0.0.1:5000/api/accounts/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Account not found");
        const accData = await res.json();
        setAccount(accData);

        // === Fetch linked transactions ===
        const txns = await getTransactionsByAccount(id);
        setTransactions(txns);
      } catch (err) {
        console.error("Error fetching account:", err);
        setError(err.message || "Failed to load account details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (transactions.length > 0) {
      alert("Cannot delete account with linked transactions.");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You are not logged in. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const response = await deleteAccount(id);
      if (!response.error) {
        alert("✅ Account deleted successfully!");
        navigate("/accounts", { replace: true });
      } else {
        alert("❌ " + response.error);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Something went wrong while deleting the account.");
    }
  };

  if (loading) return <p style={{ padding: "20px" }}>Loading...</p>;
  if (error) return <p style={{ color: "red", padding: "20px" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Delete Account</h2>
      <p><strong>Name:</strong> {account.name}</p>
      <p><strong>Type:</strong> {account.type}</p>
      <p><strong>Balance:</strong> ₹{account.current_balance.toFixed(2)}</p>
      <p><strong>Linked Transactions:</strong> {transactions.length}</p>

      {transactions.length === 0 && (
        <button
          onClick={handleDelete}
          style={{ background: "red", color: "white", padding: "10px 20px", marginRight: "10px" }}
        >
          Confirm Delete
        </button>
      )}

      <button onClick={() => navigate("/accounts")} style={{ padding: "10px 20px" }}>
        Cancel
      </button>
    </div>
  );
};

export default DeleteAccount;
