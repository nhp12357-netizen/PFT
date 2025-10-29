import sqlite3
import os
from werkzeug.security import generate_password_hash

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
DB_PATH = os.path.join(BASE_DIR, "finance.db")

with sqlite3.connect(DB_PATH) as conn:
    cursor = conn.cursor()

    # -----------------------------
    # Create a test user
    # -----------------------------
    username = "har"
    email = "har@example.com"
    password = "har"
    password_hash = generate_password_hash(password)

    cursor.execute("""
        INSERT OR IGNORE INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
    """, (username, email, password_hash))

    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    user_id = cursor.fetchone()[0]

    # -----------------------------
    # Categories
    # -----------------------------
    categories = [
        ("Entertainment", "EXPENSE"),
        ("Food & Dining", "EXPENSE"),
        ("Groceries", "EXPENSE"),
        ("Healthcare", "EXPENSE"),
        ("Investment", "EXPENSE"),
        ("Other Income", "INCOME"),
        ("Rent", "EXPENSE"),
        ("Salary", "INCOME"),
        ("Shopping", "EXPENSE"),
        ("Transportation", "EXPENSE"),
    ]

    for name, ctype in categories:
        cursor.execute("""
            INSERT OR IGNORE INTO categories (user_id, name, type)
            VALUES (?, ?, ?)
        """, (user_id, name, ctype))

    # -----------------------------
    # Accounts
    # -----------------------------
    cursor.execute("""
        INSERT OR IGNORE INTO accounts (user_id, name, type, initial_balance)
        VALUES (?, ?, ?, ?)
    """, (user_id, "SBI ACCOUNT", "CHECKING", 70000.00))

    # -----------------------------
    # Map categories to IDs
    # -----------------------------
    cursor.execute("SELECT id, name FROM categories WHERE user_id = ?", (user_id,))
    category_map = {name: cid for cid, name in cursor.fetchall()}

    # Default account ID
    cursor.execute("SELECT id FROM accounts WHERE user_id = ? AND name = ?", (user_id, "SBI ACCOUNT"))
    account_id = cursor.fetchone()[0]

    # -----------------------------
    # Transactions
    # -----------------------------
    transactions_list = [
        ("Swiggy Food Delivery", 25, "2025-10-19", "EXPENSE", "Food & Dining", 0),
        ("Monthly salary", 3000, "2025-10-01", "INCOME", "Salary", 0),
        ("Monthly Rent", 1000, "2025-10-15", "EXPENSE", "Rent", 1)
    ]

    for desc, amount, date, t_type, category_name, is_anomaly in transactions_list:
        category_id = category_map[category_name]
        cursor.execute("""
            INSERT INTO transactions
            (user_id, description, amount, date, transaction_type, account_id, category_id, is_anomaly)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, desc, amount, date, t_type, account_id, category_id, is_anomaly))

    # -----------------------------
    # Budgets
    # -----------------------------
    budgets_list = [
        ("Entertainment", 10, 2025, 500),
        ("Food & Dining", 10, 2025, 1200),
        ("Groceries", 10, 2025, 1000),
        ("Healthcare", 10, 2025, 500),
        ("Investment", 10, 2025, 1200),
        ("Other Income", 10, 2025, 150),
        ("Rent", 10, 2025, 1000),
        ("Salary", 10, 2025, 1200),
        ("Shopping", 10, 2025, 150),
        ("Transportation", 10, 2025, 500)
    ]

    for category_name, month, year, limit_amount in budgets_list:
        category_id = category_map[category_name]
        cursor.execute("""
            INSERT OR REPLACE INTO budgets (user_id, category_id, month, year, limit_amount)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, category_id, month, year, limit_amount))

print(f"Database and sample data created at: {DB_PATH}")
