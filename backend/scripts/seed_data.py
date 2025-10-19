import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
DB_PATH = os.path.join(BASE_DIR, "finance.db")

with sqlite3.connect(DB_PATH) as conn:
    cursor = conn.cursor()

    # -----------------------------
    # Categories
    # -----------------------------
    categories = [
        ("Food & Dining", "EXPENSE"),
        ("Rent", "EXPENSE"),
        ("Entertainment", "EXPENSE"),
        ("Salary", "INCOME"),
        ("Shopping - ANOMALY DETECTED", "EXPENSE")
    ]

    for name, ctype in categories:
        cursor.execute("INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)", (name, ctype))

    # -----------------------------
    # Accounts
    # -----------------------------
    cursor.execute("""
        INSERT OR IGNORE INTO accounts (name, type, initial_balance)
        VALUES (?, ?, ?)
    """, ("Checking Account", "CHECKING", 1250.75))

    # -----------------------------
    # Map categories to IDs
    # -----------------------------
    cursor.execute("SELECT id, name FROM categories")
    category_map = {name: cid for cid, name in cursor.fetchall()}

    # Default account ID
    cursor.execute("SELECT id FROM accounts WHERE name = ?", ("Checking Account",))
    account_id = cursor.fetchone()[0]

    # -----------------------------
    # Transactions
    # -----------------------------
    transactions_list = [
        ("Swiggy Food Delivery", -25, "2025-10-19", "EXPENSE", "Food & Dining", 0),
        ("Salary Credit", 3000, "2025-10-01", "INCOME", "Salary", 0),
        ("Large Purchase", -350, "2025-10-15", "EXPENSE", "Shopping - ANOMALY DETECTED", 1),
        ("Monthly Rent", -1000, "2025-10-15", "EXPENSE", "Rent", 1)
    ]

    for desc, amount, date, t_type, category_name, is_anomaly in transactions_list:
        category_id = category_map[category_name]
        cursor.execute("""
            INSERT INTO transactions
            (description, amount, date, transaction_type, account_id, category_id, is_anomaly)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (desc, amount, date, t_type, account_id, category_id, is_anomaly))

    # -----------------------------
    # Budgets
    # -----------------------------
    # Format: (category_name, month, year, limit_amount)
    budgets_list = [
        ("Food & Dining", 10, 2025, 500),
        ("Rent", 10, 2025, 1200),
        ("Entertainment", 10, 2025, 150)
    ]

    for category_name, month, year, limit_amount in budgets_list:
        category_id = category_map[category_name]
        cursor.execute("""
            INSERT OR REPLACE INTO budgets (category_id, month, year, limit_amount)
            VALUES (?, ?, ?, ?)
        """, (category_id, month, year, limit_amount))

print(f"Database created at: {DB_PATH}")
