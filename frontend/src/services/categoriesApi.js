const BASE_URL = "http://127.0.0.1:5000/api/categories";

// === FETCH CATEGORIES ===
export const fetchCategories = async () => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(BASE_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => []);
    if (!res.ok) throw new Error(data.error || data.msg || "Failed to fetch categories");

    // Always return an array
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("❌ Failed to fetch categories:", err);
    return [];
  }
};

// === ADD CATEGORY ===
export const addCategory = async (name, type) => {
  const token = localStorage.getItem("token");

  if (!name || !["INCOME", "EXPENSE"].includes(type)) {
    throw new Error("Invalid category type");
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, type }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.msg || "Failed to add category");

  return data; // Expected { id, name, type }
};

// === DELETE CATEGORY ===
export const deleteCategory = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.msg || "Failed to delete category");

  return data;
};
