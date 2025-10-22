import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("Income");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async () => {
    if (!name) return;
    try {
      const res = await fetch("http://localhost:5000/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, type })
      });
      const data = await res.json();
      if (res.ok) {
        setName("");
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this category?");
    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok) {
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Categories</h2>
      <div>
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
        <button onClick={addCategory}>Add</button>
        <button onClick={() => navigate("/transactions")} style={{ marginLeft: "10px" }}>Back</button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <table border="1" cellPadding="10" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.name}</td>
                <td>{cat.type}</td>
                <td>
                  <button onClick={() => deleteCategory(cat.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Categories;
