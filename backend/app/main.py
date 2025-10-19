from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  
DB_PATH = os.path.join(BASE_DIR, "finance.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/api/accounts", methods=["GET"])
def get_accounts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, type, initial_balance,
               COALESCE((SELECT SUM(amount)
                         FROM transactions t
                         WHERE t.account_id = a.id), 0) AS current_balance
        FROM accounts a
    """)
    
    rows = cursor.fetchall()
    conn.close()
    accounts = [dict(row) for row in rows]
    return jsonify(accounts)

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT t.id, t.date, t.description, c.name AS category, a.name AS account,
               t.amount, t.is_anomaly
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        JOIN accounts a ON t.account_id = a.id
        ORDER BY t.date DESC
        LIMIT 100
    """)
    rows = cursor.fetchall()
    conn.close()
    transactions = [dict(row) for row in rows]
    return jsonify(transactions)

@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db_connection()

    # Total balance
    total_balance_row = conn.execute("SELECT SUM(initial_balance) AS total FROM accounts").fetchone()
    total_balance = total_balance_row["total"] or 0

    # Monthly income/expense
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

    # Recent transactions (latest 5)
    recent_transactions = conn.execute("""
        SELECT t.description AS name, t.amount, c.name AS category, t.is_anomaly
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
        LIMIT 5
    """).fetchall()

    recent_transactions_list = [dict(tx) for tx in recent_transactions]

    # Budget alerts (current month)
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

if __name__ == "__main__":
    app.run(debug=True, port=5000)
