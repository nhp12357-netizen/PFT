import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) 
DB_PATH = os.path.join(BASE_DIR, "example.db")

with sqlite3.connect(DB_PATH) as conn:
    cursor = conn.cursor()

    # -----------------------------
    # Categories
    # -----------------------------
    categories = [
        (0, "Entertainment", "EXPENSE"),
        (1, "Food & Dining", "EXPENSE"),
        (2, "Groceries", "EXPENSE"),
        (3,"Healthcare", "EXPENSE"),
        (4, "Investment", "EXPENSE"),
        (5, "Other Income", "INCOME"),
        (6, "Rent", "EXPENSE"),
        (7, "Salary", "INCOME"),
        (8, "Shopping", "EXPENSE"),
        (9, "Transportation", "EXPENSE"),

    ]


    for id, name, ctype in categories:
        cursor.execute("INSERT OR IGNORE INTO categories (id, name, type) VALUES (?, ?, ?)", (id, name, ctype))

    # -----------------------------
    # Accounts
    # -----------------------------
    cursor.execute("""
        INSERT OR IGNORE INTO accounts (name, type, initial_balance)
        VALUES (?, ?, ?)
    """, ("SBI ACCOUNT", "CHECKING", 70000.00))

    # -----------------------------
    # Map categories to IDs
    # -----------------------------
    cursor.execute("SELECT id, name FROM categories")
    category_map = {name: cid for cid, name in cursor.fetchall()}

    # Default account ID
    cursor.execute("SELECT id FROM accounts WHERE name = ?", ("SBI ACCOUNT",))
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
            (description, amount, date, transaction_type, account_id, category_id, is_anomaly)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (desc, amount, date, t_type, account_id, category_id, is_anomaly))

    # -----------------------------
    # Budgets
    # -----------------------------
    # Format: (category_name, month, year, limit_amount)
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
            INSERT OR REPLACE INTO budgets (category_id, month, year, limit_amount)
            VALUES (?, ?, ?, ?)
        """, (category_id, month, year, limit_amount))

print(f"Database created at: {DB_PATH}")
