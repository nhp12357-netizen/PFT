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
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/accounts/${id}`);
        if (!res.ok) throw new Error("Account not found");
        const accData = await res.json();
        setAccount(accData);

        const txns = await getTransactionsByAccount(id);
        setTransactions(txns);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (transactions.length > 0) {
      alert("Cannot delete account with linked transactions.");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this account?");
    if (!confirmed) return;

    const res = await deleteAccount(id);
    if (res.success || res.message) {
      alert("Account deleted successfully!");
      navigate("/accounts");
    } else {
      alert(res.error || "Failed to delete account.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Delete Account</h2>
      <p><strong>Name:</strong> {account.name}</p>
      <p><strong>Type:</strong> {account.type}</p>
      <p><strong>Balance:</strong> ${account.current_balance.toFixed(2)}</p>
      <p><strong>Linked Transactions:</strong> {transactions.length}</p>

      {transactions.length === 0 && (
        <button onClick={handleDelete} style={{ background: "red", color: "white", padding: "10px 20px" }}>
          Confirm Delete
        </button>
      )}

      <button onClick={() => navigate("/accounts")} style={{ marginLeft: "10px", padding: "10px 20px" }}>
        Cancel
      </button>
    </div>
  );
};

export default DeleteAccount;
