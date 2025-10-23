

// src/services/categoriesApi.js
const BASE_URL = "http://127.0.0.1:5000/api/categories";

export const fetchCategories = async () => {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

export const addCategory = async (name, type) => {
  if (!name || !["INCOME", "EXPENSE"].includes(type)) {
    throw new Error("Invalid category type");
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add category");

  return data; // should be {id, name, type} from backend
};

export const deleteCategory = async (id) => {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to delete category");
  return data;
};