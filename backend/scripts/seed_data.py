import sqlite3
import os

# Get the parent directory of scripts (i.e., the app folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # one level up from scripts
DB_PATH = os.path.join(BASE_DIR, "finance.db")  # points to app/finance.db

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Categories
categories = [
    ("Food & Dining", "EXPENSE"),
    ("Rent", "EXPENSE"),
    ("Entertainment", "EXPENSE"),
    ("Salary", "INCOME"),
    ("Shopping - ANOMALY DETECTED", "EXPENSE")
]

for name, ctype in categories:
    cursor.execute("INSERT OR IGNORE INTO categories (name, type) VALUES (?, ?)", (name, ctype))

# Default account
cursor.execute("""
INSERT OR IGNORE INTO accounts (name, type, initial_balance)
VALUES (?, ?, ?)
""", ("Checking Account", "CHECKING", 1250.75))

# Map category names to IDs
cursor.execute("SELECT id, name FROM categories")
category_map = {name: cid for cid, name in cursor.fetchall()}

# Get default account ID
cursor.execute("SELECT id FROM accounts WHERE name = ?", ("Checking Account",))
account_id = cursor.fetchone()[0]

# Transactions
transactions = [
    ("Swiggy Food Delivery", -25, "2025-10-19", "EXPENSE", "Food & Dining", False),
    ("Salary Credit", 3000, "2025-10-01", "INCOME", "Salary", False),
    ("Large Purchase", -350, "2025-10-15", "EXPENSE", "Shopping - ANOMALY DETECTED", True)
]

for desc, amount, date, t_type, category_name, is_anomaly in transactions:
    category_id = category_map[category_name]
    cursor.execute("""
    INSERT INTO transactions
    (description, amount, date, transaction_type, account_id, category_id, is_anomaly)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (desc, amount, date, t_type, account_id, category_id, is_anomaly))

# Budgets
budgets = [
    ("Food & Dining", 450, 500, 10, 2025),
    ("Rent", 1200, 1200, 10, 2025),
    ("Entertainment", 200, 150, 10, 2025)
]

for category_name, spent, limit_amount, month, year in budgets:
    category_id = category_map[category_name]
    cursor.execute("""
    INSERT OR IGNORE INTO budgets (category_id, month, year, amount)
    VALUES (?, ?, ?, ?)
    """, (category_id, month, year, limit_amount))

# Commit & close
conn.commit()
conn.close()

print(f"Database created and seeded at: {DB_PATH}")
