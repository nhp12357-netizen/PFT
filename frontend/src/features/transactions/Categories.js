import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCategories, addCategory, deleteCategory } from "../../services/categoriesApi";

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("INCOME");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!name.trim()) return alert("Category name cannot be empty");

    try {
      const newCategory = await addCategory(name.trim(), type);
      setCategories((prev) => [...prev, newCategory]);
      setName("");
    } catch (err) {
      alert("Failed to add category: " + err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteCategory(Number(id));
      setCategories((prev) => prev.filter((cat) => cat.id !== Number(id)));
    } catch (err) {
      alert("Failed to delete category: " + err.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manage Categories</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Category Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="INCOME">INCOME</option>
          <option value="EXPENSE">EXPENSE</option>
        </select>
        <button onClick={handleAddCategory}>Add</button>
        <button onClick={() => navigate("/transactions")} style={{ marginLeft: "10px" }}>
          Back
        </button>
      </div>

      {loading ? (
        <p>Loading categories...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : categories.length === 0 ? (
        <p>No categories found.</p>
      ) : (
        <table border="1" cellPadding="10">
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
                  <button onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
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
