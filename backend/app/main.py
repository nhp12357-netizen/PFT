from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# === DATABASE CONFIGURATION ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "finance.db")
print("Using database file:", DB_PATH)


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# === INITIALIZE DATABASE ===
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

   

   # adding default categories
def add_default_categories():
    categories = [
        'Entertainment', 'Food & Dining', 'Groceries', 'Healthcare',
        'Investment', 'Other Income', 'Rent', 'Salary', 'Shopping', 'Transportation'
    ]
    conn = get_db_connection()
    cursor = conn.cursor()
    existing = cursor.execute("SELECT COUNT(*) FROM categories").fetchone()[0]
    if existing == 0:
        for cat in categories:
            cursor.execute("INSERT INTO categories (name) VALUES (?)", (cat,))
        conn.commit()
        print("Default categories added")
    else:
        print("Categories already exist")
    conn.close()



# === ADD NEW ACCOUNT ===
@app.route("/api/accounts", methods=["POST"])
def add_account():
    data = request.get_json()
    name = data.get("name")
    acc_type = data.get("type")
    initial_balance = data.get("initial_balance", 0.0)

    if not name or not acc_type:
        return jsonify({"error": "Name and type are required"}), 400

    ALLOWED_TYPES = ('CHECKING', 'SAVINGS', 'CREDIT_CARD')
    if acc_type not in ALLOWED_TYPES:
        return jsonify({"error": f"Invalid account type. Must be one of {ALLOWED_TYPES}"}), 400

    try:
        initial_balance = float(initial_balance)
    except ValueError:
        return jsonify({"error": "Initial balance must be a number"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO accounts (name, type, initial_balance)
            VALUES (?, ?, ?)
        """, (name, acc_type, initial_balance))
        conn.commit()
        new_id = cursor.lastrowid
    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Account added successfully", "id": new_id}), 201


# === GET ALL ACCOUNTS ===
@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT 
        a.id, 
        a.name, 
        a.type, 
        a.initial_balance,
        COALESCE((SELECT SUM(t.amount)
                  FROM transactions t
                  WHERE t.account_id = a.id), 0) AS current_balance
    FROM accounts a
    """)
    rows = cursor.fetchall()
    conn.close()
    accounts = [dict(row) for row in rows]
    return jsonify(accounts)


# === GET ACCOUNT / UPDATE / DELETE BY ID ===
@app.route("/api/accounts/<int:id>", methods=["GET", "DELETE", "PUT"])
def account_by_id(id):
    conn = get_db_connection()
    account = conn.execute("SELECT * FROM accounts WHERE id = ?", (id,)).fetchone()

    if account is None:
        conn.close()
        return jsonify({"error": "Account not found"}), 404

    if request.method == "GET":
        conn.close()
        return jsonify(dict(account))

    elif request.method == "DELETE":
        conn.execute("DELETE FROM accounts WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        return jsonify({"message": "Account deleted successfully"})

    elif request.method == "PUT":
        data = request.get_json()
        name = data.get("name", account["name"])
        acc_type = data.get("type", account["type"])
        initial_balance = data.get("initial_balance", account["initial_balance"])

        ALLOWED_TYPES = ('CHECKING', 'SAVINGS', 'CREDIT_CARD')
        if acc_type not in ALLOWED_TYPES:
            conn.close()
            return jsonify({"error": f"Invalid account type. Must be one of {ALLOWED_TYPES}"}), 400

        conn.execute("""
            UPDATE accounts
            SET name = ?, type = ?, initial_balance = ?
            WHERE id = ?
        """, (name, acc_type, initial_balance, id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Account updated successfully"})


# === FIXED ROUTE: ACCOUNTS WITH BALANCE ===
@app.route("/api/accounts-with-balance", methods=["GET"])
def get_accounts_with_balance():
    conn = get_db_connection()
    cursor = conn.cursor()
    query = """
        SELECT 
            a.id,
            a.name,
            a.type,
            a.initial_balance + 
            IFNULL(SUM(CASE 
                WHEN t.transaction_type = 'INCOME' THEN t.amount
                WHEN t.transaction_type = 'EXPENSE' THEN -t.amount
                ELSE 0 
            END), 0) AS current_balance
        FROM accounts a
        LEFT JOIN transactions t ON a.id = t.account_id
        GROUP BY a.id, a.name, a.type, a.initial_balance
        ORDER BY a.name;
    """
    rows = cursor.execute(query).fetchall()
    conn.close()

    accounts = [
        {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "current_balance": row[3]
        }
        for row in rows
    ]
    return jsonify(accounts)


# === GET CATEGORIES ===
@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    rows = conn.execute("SELECT id, name FROM categories").fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# === GET ALL TRANSACTIONS ===
@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    account_id = request.args.get("accountId")
    conn = get_db_connection()
    cursor = conn.cursor()

    query = """
        SELECT 
            t.id,
            t.date,
            t.description,
            t.amount,
            t.transaction_type,
            a.name AS account_name,
            c.name AS category,
            t.is_anomaly
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        JOIN categories c ON t.category_id = c.id
    """

    params = []
    if account_id:
        query += " WHERE t.account_id = ?"
        params.append(account_id)

    query += " ORDER BY t.date DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


# === ADD TRANSACTION ===
@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    data = request.get_json()
    date = data.get("date")
    description = data.get("description")
    amount = data.get("amount")
    account_id = data.get("account_id")
    category_id = data.get("category_id")
    transaction_type = data.get("transaction_type")
    target_account_id = data.get("target_account_id")

    if not date or not description or not amount or not account_id or not category_id:
        return jsonify({"error": "All fields except target_account_id are required"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "Amount must be a positive number"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        if transaction_type == "TRANSFER":
            if not target_account_id:
                return jsonify({"error": "Target account required for transfer"}), 400

            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'EXPENSE')
            """, (date, f"Transfer to account {target_account_id}", amount, account_id, category_id))
            expense_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
                VALUES (?, ?, ?, ?, ?, 'INCOME')
            """, (date, f"Transfer from account {account_id}", amount, target_account_id, category_id))
            income_id = cursor.lastrowid

            conn.commit()
            return jsonify({"message": "Transfer recorded successfully", "expense_id": expense_id, "income_id": income_id}), 201

        cursor.execute("""
            INSERT INTO transactions (date, description, amount, account_id, category_id, transaction_type)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (date, description, amount, account_id, category_id, transaction_type))
        conn.commit()
        new_id = cursor.lastrowid

    except sqlite3.Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

    return jsonify({"message": "Transaction added successfully", "id": new_id}), 201


# === DASHBOARD API ===
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db_connection()
    total_balance_row = conn.execute("SELECT SUM(initial_balance) AS total FROM accounts").fetchone()
    total_balance = total_balance_row["total"] or 0

    monthly_income_row = conn.execute("""
        SELECT SUM(amount) AS total FROM transactions
        WHERE transaction_type='INCOME' AND strftime('%m', date) = strftime('%m', 'now')
    """).fetchone()
    monthly_expense_row = conn.execute("""
        SELECT SUM(amount) AS total FROM transactions
        WHERE transaction_type='EXPENSE' AND strftime('%m', date) = strftime('%m', 'now')
    """).fetchone()

    monthly_income = monthly_income_row["total"] or 0
    monthly_expense = abs(monthly_expense_row["total"] or 0)
    savings_rate = round((monthly_income - monthly_expense) / monthly_income * 100, 1) if monthly_income else 0

    recent_transactions = conn.execute("""
        SELECT t.description AS name, t.amount, c.name AS category, t.is_anomaly
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
    """).fetchall()

    recent_transactions_list = [dict(tx) for tx in recent_transactions]

    budget_alerts_rows = conn.execute("""
        SELECT b.id, c.name AS name, b.limit_amount, 
               SUM(t.amount) AS spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        LEFT JOIN transactions t 
          ON t.category_id = c.id AND t.transaction_type='EXPENSE' 
             AND strftime('%m', t.date) = strftime('%m', 'now')
        WHERE b.month = strftime('%m', 'now')
        GROUP BY b.id
    """).fetchall()

    budget_alerts_list = []
    for row in budget_alerts_rows:
        spent = row["spent"] or 0
        limit_amt = row["limit_amount"]
        if spent < limit_amt * 0.75:
            status = "green"
        elif spent < limit_amt:
            status = "yellow"
        else:
            status = "red"
        budget_alerts_list.append({
            "name": row["name"],
            "spent": spent,
            "limit": limit_amt,
            "status": status
        })

    conn.close()

    return jsonify({
        "total_balance": total_balance,
        "monthly_income": monthly_income,
        "monthly_expense": monthly_expense,
        "savings_rate": savings_rate,
        "recent_transactions": recent_transactions_list,
        "budget_alerts": budget_alerts_list
    })


# === MAIN ENTRY ===
if __name__ == "__main__":
    init_db()
    add_default_categories()
    app.run(debug=True, port=5000)
